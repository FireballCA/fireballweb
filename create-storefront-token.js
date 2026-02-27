// Script pour créer un Storefront API Access Token via l'Admin API
// Usage: node create-storefront-token.js
// Nécessite Node.js 18+ (fetch natif)

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger le .env manuellement
function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf8')
    const env = {}
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    return env
  } catch (error) {
    return {}
  }
}

const env = loadEnv()

const SHOPIFY_STORE = env.VITE_SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || 'fireball-canada.myshopify.com'
const CLIENT_ID = env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_CLIENT_ID || ''
const CLIENT_SECRET = env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_CLIENT_SECRET || ''

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Erreur: SHOPIFY_CLIENT_ID et SHOPIFY_CLIENT_SECRET doivent être définis dans votre .env')
  console.log('\nAjoutez ces lignes dans votre fichier .env:')
  console.log('SHOPIFY_CLIENT_ID=votre-client-id')
  console.log('SHOPIFY_CLIENT_SECRET=votre-client-secret')
  process.exit(1)
}

const storeUrl = SHOPIFY_STORE.startsWith('http') ? SHOPIFY_STORE : `https://${SHOPIFY_STORE}`
const adminApiUrl = `${storeUrl}/admin/api/2024-01/storefront_access_tokens.json`

console.log('🔄 Création du Storefront API Access Token...')
console.log(`Store: ${storeUrl}`)
console.log(`Endpoint: ${adminApiUrl}\n`)

// Créer le token Storefront
async function createStorefrontToken() {
  try {
    const response = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        storefront_access_token: {
          title: 'Fireball Web App - Storefront Token',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur:', response.status, response.statusText)
      console.error('Réponse:', errorText)
      
      if (response.status === 401) {
        console.error('\n💡 Vérifiez que votre CLIENT_ID et CLIENT_SECRET sont corrects')
      } else if (response.status === 403) {
        console.error('\n💡 Votre application n\'a peut-être pas les permissions Admin API nécessaires')
      }
      return
    }

    const data = await response.json()
    const token = data.storefront_access_token?.access_token

    if (token) {
      console.log('✅ Token créé avec succès!\n')
      console.log('📋 Ajoutez cette ligne dans votre fichier .env:')
      console.log(`VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=${token}\n`)
      console.log('⚠️  N\'oubliez pas de redémarrer votre serveur de développement après!')
    } else {
      console.error('❌ Token non trouvé dans la réponse')
      console.log('Réponse complète:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du token:', error.message)
  }
}

createStorefrontToken()
