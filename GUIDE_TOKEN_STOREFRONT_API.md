# Guide : Obtenir le token Storefront API depuis Shopify

## ⚠️ Important
Le token que vous utilisez actuellement (`shpat_...`) est un **Admin API token**, pas un **Storefront API token**. Vous devez obtenir le vrai token Storefront API depuis Shopify.

## 📍 Où trouver le token Storefront API

### Étape 1 : Accéder à Headless
1. Connectez-vous à votre **Shopify Admin**
2. Allez dans **"Sales channels"** (Canaux de vente) dans le menu de gauche
3. Cliquez sur **"Headless"** (ou **"Sans tête"**)

### Étape 2 : Sélectionner votre storefront
1. Si vous avez déjà créé un storefront headless, cliquez dessus
2. Si vous n'en avez pas, créez-en un nouveau :
   - Cliquez sur **"Add storefront"** (Ajouter un storefront)
   - Donnez-lui un nom (ex: "Fireball Web App")
   - Cliquez sur **"Create storefront"**

### Étape 3 : Obtenir le token
1. Dans la page de votre storefront, cherchez la section **"Storefront API"**
2. Vous verrez deux types de tokens :
   - **Private access token** (Token d'accès privé) - Pour les requêtes serveur
   - **Public access token** (Token d'accès public) - Pour les requêtes frontend
3. **Pour le développement frontend**, copiez le **Private access token**
   - ⚠️ Note : En production, vous devriez utiliser une route API backend, mais pour le développement, le private token fonctionnera

### Étape 4 : Mettre à jour votre `.env`
1. Ouvrez votre fichier `.env`
2. Remplacez la ligne `VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_...` par :
   ```
   VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=votre-nouveau-token-storefront-ici
   ```
3. **Important** : Le nouveau token ne doit **PAS** commencer par `shpat_`
4. Redémarrez votre serveur de développement (`npm run dev`)

## ✅ Vérification
Après avoir mis à jour le token, testez la connexion. Le token devrait maintenant fonctionner avec l'endpoint :
```
https://fireball-canada.myshopify.com/api/2024-10/graphql.json
```

## 🔒 Sécurité
- ⚠️ **Ne jamais** exposer le token dans les logs du navigateur (déjà corrigé dans le code)
- ⚠️ En production, créez une route API backend pour faire les appels Shopify
- ⚠️ Le token privé ne devrait pas être dans le frontend en production

## 📚 Documentation
- [Storefront API - Getting Started](https://shopify.dev/docs/api/storefront/latest)
- [Storefront API - Authentication](https://shopify.dev/docs/api/storefront/latest/authentication)
