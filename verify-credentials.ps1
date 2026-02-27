# Script pour verifier les identifiants Shopify
$ErrorActionPreference = "Stop"

Write-Host "=== Verification des identifiants Shopify ===" -ForegroundColor Cyan
Write-Host ""

# Lire .env
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERREUR] Fichier .env non trouve" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw
$lines = $envContent -split "`n"

$store = $null
$clientId = $null
$clientSecret = $null

foreach ($line in $lines) {
    $line = $line.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        if ($line -match "^VITE_SHOPIFY_STORE_URL=(.+)$") {
            $store = $matches[1].Trim()
        }
        if ($line -match "^SHOPIFY_CLIENT_ID=(.+)$") {
            $clientId = $matches[1].Trim()
        }
        if ($line -match "^SHOPIFY_CLIENT_SECRET=(.+)$") {
            $clientSecret = $matches[1].Trim()
        }
    }
}

Write-Host "Variables trouvees:" -ForegroundColor Gray
Write-Host "  Store URL: $(if ($store) { $store } else { '[MANQUANT]' })" -ForegroundColor Gray
Write-Host "  Client ID: $(if ($clientId) { $clientId } else { '[MANQUANT]' })" -ForegroundColor Gray
Write-Host "  Client Secret: $(if ($clientSecret) { $clientSecret.Substring(0, [Math]::Min(15, $clientSecret.Length)) + '...' } else { '[MANQUANT]' })" -ForegroundColor Gray
Write-Host ""

if (-not $store -or -not $clientId -or -not $clientSecret) {
    Write-Host "[ERREUR] Variables manquantes" -ForegroundColor Red
    exit 1
}

# Preparer l'URL
if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

# Test 1: Verifier le format des identifiants
Write-Host "Test 1: Format des identifiants" -ForegroundColor Yellow
if ($clientId -match "^[a-f0-9]{32}$") {
    Write-Host "  Client ID: Format Admin API valide (32 caracteres hex)" -ForegroundColor Green
} else {
    Write-Host "  Client ID: Format suspect (attendu: 32 caracteres hex)" -ForegroundColor Red
}

if ($clientSecret -match "^shpss_[a-f0-9]+$") {
    Write-Host "  Client Secret: Format Admin API valide (commence par shpss_)" -ForegroundColor Green
} else {
    Write-Host "  Client Secret: Format suspect (attendu: commence par shpss_)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Tester l'authentification avec une requete simple
Write-Host "Test 2: Authentification Admin API" -ForegroundColor Yellow
$url = "$store/admin/api/2024-01/shop.json"
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${clientId}:${clientSecret}"))

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers @{
        "Authorization" = "Basic $credentials"
    }
    
    Write-Host "  [SUCCES] Authentification reussie!" -ForegroundColor Green
    Write-Host "  Nom du shop: $($response.shop.name)" -ForegroundColor Gray
} catch {
    Write-Host "  [ERREUR] Authentification echouee" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Code HTTP: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "  [INFO] Les identifiants ne sont pas valides pour l'Admin API." -ForegroundColor Yellow
            Write-Host "  [INFO] Verifiez que vous avez copie les identifiants Admin API," -ForegroundColor Yellow
            Write-Host "  [INFO] pas les identifiants Storefront API ou autre." -ForegroundColor Yellow
            Write-Host "" -ForegroundColor Yellow
            Write-Host "  Ou creer le token Storefront API directement dans Shopify:" -ForegroundColor Yellow
            Write-Host "  1. Shopify Admin -> Applications -> Fireball Web App" -ForegroundColor White
            Write-Host "  2. Storefront API -> Creer un token" -ForegroundColor White
        }
    }
}
