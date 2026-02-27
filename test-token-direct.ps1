# Test direct du token Storefront API
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
$token = $envVars['VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN']

if (-not $store) {
    $store = "fireball-canada.myshopify.com"
}

if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

if (-not $token) {
    Write-Host "❌ Token non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Test du token Storefront API..." -ForegroundColor Cyan
Write-Host "Store: $store" -ForegroundColor Gray
Write-Host "Token (premiers 20 chars): $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
Write-Host ""

# Test 1: Requête simple shop
$url = "$store/api/2024-01/graphql.json"
$query1 = @{
    query = "{ shop { name } }"
} | ConvertTo-Json

Write-Host "Test 1: Requête shop { name }" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Content-Type" = "application/json"
        "X-Shopify-Storefront-Access-Token" = $token
    } -Body $query1
    
    Write-Host "✅ Test 1 réussi!" -ForegroundColor Green
    Write-Host "Réponse: $($response1 | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test 1 échoué: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse d'erreur: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Requête products (sans token, devrait fonctionner)
Write-Host "Test 2: Requête products (sans token - tokenless)" -ForegroundColor Yellow
$query2 = @{
    query = "{ products(first: 1) { edges { node { id title } } } }"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Content-Type" = "application/json"
    } -Body $query2
    
    Write-Host "✅ Test 2 réussi (tokenless fonctionne)!" -ForegroundColor Green
} catch {
    Write-Host "❌ Test 2 échoué: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Si le Test 1 échoue mais pas le Test 2, le token est invalide." -ForegroundColor Yellow
Write-Host "💡 Vérifiez dans Shopify que le token est bien un Storefront API token." -ForegroundColor Yellow
