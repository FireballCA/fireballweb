import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function shopifyCustomerApiPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const shopifyStoreUrl = env.SHOPIFY_STORE_URL || env.VITE_SHOPIFY_STORE_URL || ''
  const shopifyAdminApiToken = env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10'
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
  plugins: [react(), shopifyCustomerApiPlugin(mode)],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
}))
