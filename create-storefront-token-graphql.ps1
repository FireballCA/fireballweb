# Script pour créer un Storefront API token via GraphQL Admin API
# Ce script nécessite d'abord d'installer l'application pour obtenir un access token

$envFile = Get-Content ".env" -ErrorAction SilentlyContinue
$envVars = @{}
foreach ($line in $envFile) {
    if ($line -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

$store = $envVars['VITE_SHOPIFY_STORE_URL']
$clientId = $envVars['SHOPIFY_CLIENT_ID']

if (-not $store) {
    $store = "fireball-canada.myshopify.com"
}

if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

Write-Host "📋 Instructions pour obtenir le Storefront API Token:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Méthode 1: Via l'interface web (RECOMMANDÉ)" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur cette URL:" -ForegroundColor White
Write-Host "   https://admin.shopify.com/store/fireball-canada/settings/apps" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Cliquez sur 'Fireball Web App'" -ForegroundColor White
Write-Host ""
Write-Host "3. Dans le sidebar, cliquez sur 'Paramètres'" -ForegroundColor White
Write-Host ""
Write-Host "4. Faites défiler jusqu'à trouver 'API Storefront' ou 'Storefront API'" -ForegroundColor White
Write-Host ""
Write-Host "5. Si vous ne la voyez pas, essayez de:" -ForegroundColor White
Write-Host "   - Installer l'application sur votre store d'abord" -ForegroundColor Gray
Write-Host "   - Ou chercher dans 'Versions' → votre version → 'Scopes'" -ForegroundColor Gray
Write-Host ""
Write-Host "Méthode 2: Installer l'application d'abord" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour que l'API Storefront apparaisse, vous devez peut-être d'abord installer" -ForegroundColor White
Write-Host "l'application sur votre store. Voici comment:" -ForegroundColor White
Write-Host ""
Write-Host "1. Allez sur:" -ForegroundColor White
Write-Host "   https://admin.shopify.com/store/fireball-canada/apps" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Cherchez 'Fireball Web App' et cliquez sur 'Installer'" -ForegroundColor White
Write-Host ""
Write-Host "3. Après l'installation, retournez dans les paramètres de l'application" -ForegroundColor White
Write-Host "   et cherchez 'API Storefront'" -ForegroundColor White
Write-Host ""
Write-Host "Méthode 3: Utiliser Shopify CLI" -ForegroundColor Yellow
Write-Host ""
Write-Host "Si vous avez Shopify CLI installé, vous pouvez utiliser:" -ForegroundColor White
Write-Host "  shopify app generate extension" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mais cela nécessite une configuration plus complexe." -ForegroundColor Gray
Write-Host ""
