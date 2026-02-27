import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function shopifyCustomerApiPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const shopifyStoreUrl = env.SHOPIFY_STORE_URL || env.VITE_SHOPIFY_STORE_URL || ''
  const shopifyAdminApiToken = env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  return {
    name: 'shopify-customer-api-dev',
    configureServer(server) {
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
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), shopifyCustomerApiPlugin(mode)],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
}))
