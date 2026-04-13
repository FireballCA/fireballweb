import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function shopifyCustomerApiPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const shopifyStoreUrl = env.SHOPIFY_STORE_URL || env.VITE_SHOPIFY_STORE_URL || ''
  const shopifyStorefrontToken =
    env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || ''
  const shopifyStorefrontApiVersion =
    env.SHOPIFY_STOREFRONT_API_VERSION || env.VITE_SHOPIFY_STOREFRONT_API_VERSION || '2024-10'
  const shopifyAdminApiToken = env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10'
  const supabaseUrl = env.SUPABASE_URL || ''
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
  const resendApiKey = env.RESEND_API_KEY || env.RESEND_KEY || ''
  const cleanInline = (value: unknown): string => String(value || '').replace(/[\r\n]+/g, '').trim()
  const toResendTagToken = (value: unknown, fallback = 'unknown'): string => {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
    return normalized || fallback
  }
  const extractEmailDomain = (value: string): string => {
    const bracketMatch = value.match(/<([^>]+)>/)
    const emailValue = (bracketMatch ? bracketMatch[1] : value).toLowerCase()
    const atIndex = emailValue.lastIndexOf('@')
    return atIndex === -1 ? '' : emailValue.slice(atIndex + 1)
  }
  const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])
  const configuredFromEmail = cleanInline(
    env.FIREBALL_FROM_EMAIL || 'Fireball Canada <no-reply@fireballcanada.com>',
  )
  const configuredFromDomain = extractEmailDomain(configuredFromEmail)
  const fireballFromEmail =
    configuredFromDomain && !PUBLIC_EMAIL_DOMAINS.has(configuredFromDomain)
      ? configuredFromEmail
      : 'Fireball Canada <onboarding@resend.dev>'

  const readJsonBody = async (req: any): Promise<Record<string, unknown>> =>
    await new Promise((resolve) => {
      let body = ''
      req.on('data', (chunk: Buffer | string) => {
        body += String(chunk)
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}') as Record<string, unknown>)
        } catch {
          resolve({})
        }
      })
    })

  const fetchShopifyAdminJson = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiToken,
      },
    })
    const data = (await response.json().catch(() => null)) as any
    return { ok: response.ok, data }
  }

  return {
    name: 'shopify-customer-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/shopify-storefront', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyStorefrontToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'Missing SHOPIFY_STORE_URL or SHOPIFY_STOREFRONT_ACCESS_TOKEN (server env, not exposed to the client).',
            }),
          )
          return
        }

        try {
          const body = (await readJsonBody(req)) as { query?: unknown; variables?: Record<string, unknown> }
          const query = typeof body.query === 'string' ? body.query : ''
          if (!query.trim()) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing GraphQL query' }))
            return
          }

          const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
            ? shopifyStoreUrl
            : `https://${shopifyStoreUrl}`
          const endpoint = `${normalizedStoreUrl}/api/${shopifyStorefrontApiVersion}/graphql.json`

          const sfResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Storefront-Access-Token': shopifyStorefrontToken,
            },
            body: JSON.stringify({
              query,
              variables: body.variables,
            }),
          })

          const payload = (await sfResponse.json().catch(() => null)) as unknown
          res.statusCode = sfResponse.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload ?? { errors: [{ message: 'Invalid JSON from Shopify' }] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Shopify Storefront proxy failed',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })

      server.middlewares.use('/api/shopify-secure-cart', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyStorefrontToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing Shopify Storefront server configuration.' }))
          return
        }

        try {
          const body = (await readJsonBody(req)) as { lines?: Array<{ shopifyVariantId?: string; quantity?: number }> }
          const lines = Array.isArray(body.lines)
            ? body.lines
                .map((line) => ({
                  shopifyVariantId: String(line?.shopifyVariantId || ''),
                  quantity: Number(line?.quantity || 0),
                }))
                .filter((line) => line.shopifyVariantId && Number.isFinite(line.quantity) && line.quantity > 0)
            : []

          if (!lines.length) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Cart is empty or invalid' }))
            return
          }

          let isPartner = false
          const authHeader = String(req.headers.authorization || '')
          const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
          if (token && supabaseUrl && supabaseServiceRoleKey) {
            const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
              method: 'GET',
              headers: {
                apikey: supabaseServiceRoleKey,
                Authorization: `Bearer ${token}`,
              },
            })
            const userJson = (await userRes.json().catch(() => null)) as any
            const uid = typeof userJson?.id === 'string' ? userJson.id : ''
            if (uid) {
              const profileRes = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=role,partner_status&limit=1`,
                {
                  method: 'GET',
                  headers: {
                    apikey: supabaseServiceRoleKey,
                    Authorization: `Bearer ${supabaseServiceRoleKey}`,
                  },
                },
              )
              const profileJson = (await profileRes.json().catch(() => [])) as any[]
              const profile = Array.isArray(profileJson) ? profileJson[0] : null
              const role = String(profile?.role || '').toLowerCase()
              const partnerStatus = String(profile?.partner_status || '').toLowerCase()
              isPartner = role === 'partner' || partnerStatus === 'partner'
            }
          }

          const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
            ? shopifyStoreUrl
            : `https://${shopifyStoreUrl}`
          const endpoint = `${normalizedStoreUrl}/api/${shopifyStorefrontApiVersion}/graphql.json`
          const variantQuery = `
            query VariantAccess($id: ID!) {
              node(id: $id) {
                ... on ProductVariant {
                  id
                  product { tags }
                }
              }
            }
          `
          const restrictedTags = new Set(['partner-only', 'installer-only', 'installer', 'partner'])

          for (const line of lines) {
            const sfResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': shopifyStorefrontToken,
              },
              body: JSON.stringify({ query: variantQuery, variables: { id: line.shopifyVariantId } }),
            })
            const payload = (await sfResponse.json().catch(() => null)) as any
            const tags = Array.isArray(payload?.data?.node?.product?.tags) ? payload.data.node.product.tags : []
            const isRestricted = tags.some((tag: unknown) =>
              restrictedTags.has(String(tag || '').toLowerCase().trim()),
            )
            if (isRestricted && !isPartner) {
              res.statusCode = 403
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: 'Access denied for restricted product',
                  code: 'PARTNER_REQUIRED',
                  redirectTo: '/join-fireball',
                }),
              )
              return
            }
          }

          const encoded = lines
            .map((line) => {
              const numericId = line.shopifyVariantId.split('/').pop()
              if (!numericId) return null
              return `${numericId}:${line.quantity}`
            })
            .filter(Boolean)

          if (!encoded.length) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'No valid Shopify variants in cart' }))
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              checkoutUrl: `${normalizedStoreUrl.replace(/\/+$/, '')}/cart/${encoded.join(',')}`,
            }),
          )
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Secure checkout validation failed',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })

      server.middlewares.use('/api/create-shopify-customer', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
            }),
          )
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}') as {
              email?: string
              first_name?: string
              last_name?: string
            }

            const email = parsed.email?.trim()
            const firstName = parsed.first_name?.trim() || ''
            const lastName = parsed.last_name?.trim() || ''

            if (!email) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing required field: email' }))
              return
            }

            const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
              ? shopifyStoreUrl
              : `https://${shopifyStoreUrl}`
            const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`

            const mutation = `
              mutation customerCreate($input: CustomerInput!) {
                customerCreate(input: $input) {
                  customer {
                    id
                    email
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAdminApiToken,
              },
              body: JSON.stringify({
                query: mutation,
                variables: {
                  input: {
                    email,
                    firstName,
                    lastName,
                  },
                },
              }),
            })

            const result = await response.json()
            const userErrors = result?.data?.customerCreate?.userErrors || []

            if (!response.ok || result?.errors?.length || userErrors.length) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: 'Failed to create Shopify customer',
                  details: result?.errors || userErrors,
                }),
              )
              return
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: true,
                customer: result?.data?.customerCreate?.customer || null,
              }),
            )
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
              }),
            )
          }
        })
      })

      server.middlewares.use('/api/update-shopify-customer', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
            }),
          )
          return
        }

        try {
          const body = (await readJsonBody(req)) as {
            email?: string
            first_name?: string
            last_name?: string
          }

          const email = (body.email || '').trim()
          const firstName = (body.first_name || '').trim()
          const lastName = (body.last_name || '').trim()

          if (!email) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing required field: email' }))
            return
          }

          const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
            ? shopifyStoreUrl
            : `https://${shopifyStoreUrl}`
          const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`

          const lookupQuery = `
            query customersByEmail($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                    email
                  }
                }
              }
            }
          `

          const lookupResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyAdminApiToken,
            },
            body: JSON.stringify({
              query: lookupQuery,
              variables: {
                query: `email:${email}`,
              },
            }),
          })

          const lookupResult = (await lookupResponse.json()) as any

          if (!lookupResponse.ok || lookupResult?.errors?.length) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Failed to lookup Shopify customer',
                details: lookupResult?.errors || null,
              }),
            )
            return
          }

          const edges = lookupResult?.data?.customers?.edges || []
          if (!Array.isArray(edges) || edges.length === 0 || !edges[0]?.node?.id) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, skipped: 'customer_not_found' }))
            return
          }

          const customerId = edges[0].node.id

          const updateMutation = `
            mutation customerUpdate($id: ID!, $input: CustomerInput!) {
              customerUpdate(id: $id, input: $input) {
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

          const input = {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          }

          const updateResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyAdminApiToken,
            },
            body: JSON.stringify({
              query: updateMutation,
              variables: {
                id: customerId,
                input,
              },
            }),
          })

          const updateResult = (await updateResponse.json()) as any
          const userErrors = updateResult?.data?.customerUpdate?.userErrors || []

          if (!updateResponse.ok || updateResult?.errors?.length || userErrors.length) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Failed to update Shopify customer',
                details: updateResult?.errors || userErrors || null,
              }),
            )
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: true,
              customer: updateResult?.data?.customerUpdate?.customer || null,
            }),
          )
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })

      server.middlewares.use('/api/send-shopify-customer-invite', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
            }),
          )
          return
        }

        try {
          const body = (await readJsonBody(req)) as { shopifyCustomerId?: string }
          const shopifyCustomerId = typeof body.shopifyCustomerId === 'string' ? body.shopifyCustomerId.trim() : ''
          if (!shopifyCustomerId || !shopifyCustomerId.startsWith('gid://shopify/Customer/')) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing or invalid shopifyCustomerId' }))
            return
          }

          const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
            ? shopifyStoreUrl
            : `https://${shopifyStoreUrl}`
          const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`

          const mutation = `
            mutation customerSendAccountInviteEmail($customerId: ID!) {
              customerSendAccountInviteEmail(customerId: $customerId) {
                customer { id }
                userErrors { field message }
              }
            }
          `
          const inviteResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyAdminApiToken,
            },
            body: JSON.stringify({
              query: mutation,
              variables: { customerId: shopifyCustomerId },
            }),
          })
          const inviteResult = (await inviteResponse.json()) as any
          const userErrors = inviteResult?.data?.customerSendAccountInviteEmail?.userErrors || []
          const errors = inviteResult?.errors || []

          if (!inviteResponse.ok || errors.length || userErrors.length) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Failed to send Shopify account invite email',
                details: errors.length ? errors : userErrors,
              }),
            )
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, message: 'Invite email sent' }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })

      server.middlewares.use('/api/shopify-order-preview', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!shopifyStoreUrl || !shopifyAdminApiToken) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
            }),
          )
          return
        }

        try {
          const body = (await readJsonBody(req)) as { orderIds?: unknown[] }
          const orderIds = Array.isArray(body.orderIds)
            ? body.orderIds.map((id) => String(id || '').trim()).filter(Boolean).slice(0, 10)
            : []

          if (!orderIds.length) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, previews: {} }))
            return
          }

          const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
            ? shopifyStoreUrl
            : `https://${shopifyStoreUrl}`

          const previews: Record<string, any> = {}

          for (const orderId of orderIds) {
            try {
              const orderUrl = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/orders/${encodeURIComponent(
                orderId,
              )}.json?status=any&fields=id,name,currency,line_items`
              const orderRes = await fetchShopifyAdminJson(orderUrl)
              const order = orderRes?.data?.order || null
              if (!order) continue

              const firstItem =
                Array.isArray(order.line_items) && order.line_items.length > 0
                  ? order.line_items[0]
                  : null

              let imageUrl =
                firstItem?.image?.src ||
                firstItem?.image?.url ||
                firstItem?.featured_image?.src ||
                firstItem?.featured_image?.url ||
                null

              if (!imageUrl && firstItem?.product_id) {
                const productUrl = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/products/${encodeURIComponent(
                  String(firstItem.product_id),
                )}.json?fields=id,image,images,title`
                const productRes = await fetchShopifyAdminJson(productUrl)
                const product = productRes?.data?.product || null
                imageUrl =
                  product?.image?.src ||
                  (Array.isArray(product?.images) ? product.images[0]?.src : null) ||
                  null
              }

              previews[orderId] = {
                orderName: typeof order.name === 'string' ? order.name : null,
                currency: typeof order.currency === 'string' ? order.currency : null,
                productTitle:
                  typeof firstItem?.title === 'string'
                    ? firstItem.title
                    : (typeof firstItem?.name === 'string' ? firstItem.name : null),
                imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
              }
            } catch {
              // Ignore per-order failures in dev middleware.
            }
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, previews }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })

      server.middlewares.use('/api/send-partner-approval-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!resendApiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Missing RESEND_API_KEY in local server env.',
            }),
          )
          return
        }

        try {
          const payload = await readJsonBody(req)
          const to = cleanInline(payload.to || '')
          const subject = String(payload.subject || '').trim()
          const message = String(payload.message || '').trim()
          const html = String(payload.html || '').trim()
          const companyName = String(payload.companyName || '').trim()
          const flowTag = String(payload.flowTag || 'partner_approval').trim() || 'partner_approval'
          const safeFlowTag = toResendTagToken(flowTag, 'partner_flow')
          const safeCompanyTag = toResendTagToken(companyName, 'unknown')

          if (!to || !subject || !message) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing required fields: to, subject, message' }))
            return
          }

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fireballFromEmail,
              to: [to],
              subject,
              text: message,
              html: html || undefined,
              tags: [
                { name: 'flow', value: safeFlowTag },
                { name: 'company', value: safeCompanyTag },
              ],
            }),
          })

          const data = await resendResponse.json().catch(() => ({}))
          if (!resendResponse.ok) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Resend rejected the email request.',
                details: data,
              }),
            )
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: true,
              provider: 'resend',
              id: (data as { id?: string })?.id || null,
            }),
          )
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react(), shopifyCustomerApiPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      /** Deux entrées distinctes vers des .ts : un seul fichier .ts pour tout le préfixe faisait résoudre …/index.js sous ce chemin (ENOENT). */
      'use-sync-external-store/shim/index.js': path.resolve(
        __dirname,
        'src/shims/use-sync-external-store-shim/index.ts',
      ),
      'use-sync-external-store/shim/with-selector.js': path.resolve(
        __dirname,
        'src/shims/use-sync-external-store-shim/with-selector.ts',
      ),
    },
  },
  optimizeDeps: {
    exclude: ['lenis'],
    include: [
      'three',
      'three-globe',
      '@react-three/fiber',
      '@react-three/drei',
      'react-router-dom',
      /** CJS → ESM : évite erreurs d’export sur useSyncExternalStore (react-aria / HeroUI). */
      'use-sync-external-store/shim',
      'use-sync-external-store',
    ],
  },
  server: {
    watch: {
      usePolling: true,
      interval: 150,
    },
  },
}))
