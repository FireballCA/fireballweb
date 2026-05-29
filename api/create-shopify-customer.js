import { requireAuth } from './_auth.js'
import { cleanInline, isValidEmail, parseJsonBody, rateLimit } from './_security.js'

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || 'fireball-canada.myshopify.com'
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  ''
const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

function isAlreadyExistsError(errors) {
  if (!Array.isArray(errors)) return false
  return errors.some((entry) => {
    const code = String(entry?.code || '').toUpperCase()
    const message = String(entry?.message || '').toLowerCase()
    return (
      code === 'TAKEN' ||
      code === 'UNIDENTIFIED_CUSTOMER' ||
      message.includes('taken') ||
      message.includes('already exists') ||
      message.includes('has already been taken') ||
      message.includes('already been registered')
    )
  })
}

async function shopifyGraphql(endpoint, token, tokenHeader, query, variables) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [tokenHeader]: token,
    },
    body: JSON.stringify({ query, variables }),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

async function lookupCustomerByEmailGraphql(adminEndpoint, email) {
  const lookupQuery = `
    query customersByEmail($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            email
            firstName
            lastName
          }
        }
      }
    }
  `
  const { response, data } = await shopifyGraphql(
    adminEndpoint,
    SHOPIFY_ADMIN_TOKEN,
    'X-Shopify-Access-Token',
    lookupQuery,
    { query: `email:"${email.replace(/"/g, '\\"')}"` },
  )
  if (!response.ok || data?.errors?.length) return null
  return data?.data?.customers?.edges?.[0]?.node || null
}

async function lookupCustomerByEmailRest(storeUrl, email) {
  const searchUrl = `${storeUrl}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=${encodeURIComponent(`email:${email}`)}`
  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return null
  const row = Array.isArray(data?.customers) ? data.customers[0] : null
  if (!row?.id) return null
  return {
    id: `gid://shopify/Customer/${row.id}`,
    email: row.email || email,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
  }
}

async function lookupCustomerByEmail(adminEndpoint, storeUrl, email) {
  const fromGraphql = await lookupCustomerByEmailGraphql(adminEndpoint, email)
  if (fromGraphql?.id) return fromGraphql
  return lookupCustomerByEmailRest(storeUrl, email)
}

function respondExistingCustomer(res, customer, reusedExisting = true) {
  return res.status(200).json({
    success: true,
    customer: customer || { email: customer?.email },
    shopifyCustomerId: customer?.id || null,
    reusedExisting,
  })
}

function respondAlreadyExistsWithoutId(res, email) {
  return res.status(200).json({
    success: true,
    customer: { email },
    shopifyCustomerId: null,
    reusedExisting: true,
    message: 'Customer already exists in Shopify',
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'create-shopify-customer', windowMs: 15 * 60_000, max: 8 })) return

  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const payload = parseJsonBody(req)
  const email = cleanInline(payload.email, 254).toLowerCase()
  const firstName = cleanInline(payload.first_name, 80)
  const lastName = cleanInline(payload.last_name, 80)
  const password = String(payload.password || '')

  if (!email) {
    return res.status(400).json({ error: 'Missing required field: email' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  if (auth.user.email?.toLowerCase() !== email) {
    return res.status(403).json({ error: 'Forbidden: cannot create another user customer' })
  }
  if (password && (password.length < 8 || password.length > 128)) {
    return res.status(400).json({ error: 'Invalid password length' })
  }

  if (!SHOPIFY_ADMIN_TOKEN) {
    return res.status(500).json({
      error: 'Missing SHOPIFY_ADMIN_API_TOKEN in server env.',
    })
  }

  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  const adminEndpoint = `${normalizedStoreUrl}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  const storefrontEndpoint = `${normalizedStoreUrl}/api/${SHOPIFY_API_VERSION}/graphql.json`

  try {
    const existingCustomer = await lookupCustomerByEmail(adminEndpoint, normalizedStoreUrl, email)
    if (existingCustomer?.id) {
      return respondExistingCustomer(res, existingCustomer)
    }

    if (password && SHOPIFY_STOREFRONT_TOKEN) {
      const storefrontMutation = `
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
              email
              firstName
              lastName
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `
      const { response, data } = await shopifyGraphql(
        storefrontEndpoint,
        SHOPIFY_STOREFRONT_TOKEN,
        'X-Shopify-Storefront-Access-Token',
        storefrontMutation,
        {
          input: {
            email,
            password,
            firstName,
            lastName,
          },
        },
      )
      const userErrors = data?.data?.customerCreate?.customerUserErrors || []
      const graphqlErrors = data?.errors || []
      const customer = data?.data?.customerCreate?.customer || null

      if (customer?.id) {
        return res.status(200).json({
          success: true,
          customer,
          shopifyCustomerId: customer.id,
        })
      }

      if (isAlreadyExistsError(userErrors) || isAlreadyExistsError(graphqlErrors)) {
        const reusedCustomer = await lookupCustomerByEmail(adminEndpoint, normalizedStoreUrl, email)
        if (reusedCustomer?.id) {
          return respondExistingCustomer(res, reusedCustomer)
        }
        return respondAlreadyExistsWithoutId(res, email)
      }

      if (!response.ok || graphqlErrors.length || userErrors.length) {
        return res.status(400).json({
          error: `Failed to create Shopify customer (HTTP ${response.status})`,
          details: graphqlErrors.length ? graphqlErrors : userErrors,
        })
      }
    }

    const adminMutation = `
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
          }
          userErrors {
            field
            message
          }
        }
      }
    `
    const { response, data } = await shopifyGraphql(
      adminEndpoint,
      SHOPIFY_ADMIN_TOKEN,
      'X-Shopify-Access-Token',
      adminMutation,
      {
        input: {
          email,
          firstName,
          lastName,
        },
      },
    )
    const userErrors = data?.data?.customerCreate?.userErrors || []
    const graphqlErrors = data?.errors || []
    const customer = data?.data?.customerCreate?.customer || null

    if (customer?.id) {
      return res.status(200).json({
        success: true,
        customer,
        shopifyCustomerId: customer.id,
      })
    }

    if (isAlreadyExistsError(userErrors) || isAlreadyExistsError(graphqlErrors)) {
      const reusedCustomer = await lookupCustomerByEmail(adminEndpoint, normalizedStoreUrl, email)
      if (reusedCustomer?.id) {
        return respondExistingCustomer(res, reusedCustomer)
      }
      return respondAlreadyExistsWithoutId(res, email)
    }

    if (!response.ok || graphqlErrors.length || userErrors.length) {
      return res.status(400).json({
        error: `Failed to create Shopify customer (HTTP ${response.status})`,
        details: graphqlErrors.length ? graphqlErrors : userErrors,
      })
    }

    return res.status(500).json({ error: 'Shopify customer creation returned no customer' })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
