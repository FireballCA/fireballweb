# Script pour lister les Storefront API tokens existants
# Usage: .\list-storefront-tokens.ps1

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
    Write-Host "❌ Erreur: VITE_SHOPIFY_STORE_URL non trouvé dans .env" -ForegroundColor Red
    exit 1
}

if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

Write-Host "📋 Instructions pour obtenir le Storefront API Token:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Allez dans votre admin Shopify:" -ForegroundColor Yellow
Write-Host "   https://admin.shopify.com/store/fireball-canada" -ForegroundColor White
Write-Host ""
Write-Host "2. Allez dans Apps (Applications)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Cliquez sur votre application 'Fireball Web App'" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Dans le sidebar, cliquez sur 'Paramètres'" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Cherchez une section 'API Storefront' ou 'Storefront API'" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Si vous ne la voyez pas, essayez:" -ForegroundColor Yellow
Write-Host "   - Cliquer sur 'Versions' dans le sidebar" -ForegroundColor White
Write-Host "   - Ouvrir votre version (Version 1 ou Draft)" -ForegroundColor White
Write-Host "   - Chercher 'API Storefront' dans les onglets" -ForegroundColor White
Write-Host ""
Write-Host "7. Une fois trouvé, cliquez sur 'Configurer' ou 'Révéler le token'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Alternative: Utilisez cette URL directe:" -ForegroundColor Cyan
Write-Host "https://admin.shopify.com/store/fireball-canada/settings/apps" -ForegroundColor White
Write-Host ""
