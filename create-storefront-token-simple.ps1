# Script simplifie pour creer un Storefront API Access Token
$ErrorActionPreference = "Stop"

Write-Host "=== Creation du Storefront API Token ===" -ForegroundColor Cyan
Write-Host ""

# Lire .env
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERREUR] Fichier .env non trouve: $envPath" -ForegroundColor Red
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
Write-Host "  Client ID: $(if ($clientId) { $clientId.Substring(0, [Math]::Min(10, $clientId.Length)) + '...' } else { '[MANQUANT]' })" -ForegroundColor Gray
Write-Host "  Client Secret: $(if ($clientSecret) { $clientSecret.Substring(0, [Math]::Min(10, $clientSecret.Length)) + '...' } else { '[MANQUANT]' })" -ForegroundColor Gray
Write-Host ""

if (-not $store) {
    Write-Host "[ERREUR] VITE_SHOPIFY_STORE_URL manquant dans .env" -ForegroundColor Red
    exit 1
}

if (-not $clientId -or -not $clientSecret) {
    Write-Host "[ERREUR] SHOPIFY_CLIENT_ID ou SHOPIFY_CLIENT_SECRET manquant dans .env" -ForegroundColor Red
    exit 1
}

# Preparer l'URL
if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

$url = "$store/admin/api/2024-01/storefront_access_tokens.json"
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

# Creer les credentials
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${clientId}:${clientSecret}"))

# Creer le body
$body = @{
    storefront_access_token = @{
        title = "Fireball Web App - Storefront Token"
    }
} | ConvertTo-Json

Write-Host "Envoi de la requete..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Basic $credentials"
    } -Body $body

    $token = $response.storefront_access_token.access_token
    
    if ($token) {
        Write-Host "" -ForegroundColor Green
        Write-Host "[SUCCES] Token cree avec succes!" -ForegroundColor Green
        Write-Host "" -ForegroundColor Green
        Write-Host "Copiez cette ligne dans votre fichier .env:" -ForegroundColor Yellow
        Write-Host "VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=$token" -ForegroundColor White
        Write-Host "" -ForegroundColor Yellow
        Write-Host "[ATTENTION] Redemarrez votre serveur de developpement apres!" -ForegroundColor Yellow
    } else {
        Write-Host "[ERREUR] Token non trouve dans la reponse" -ForegroundColor Red
        Write-Host ($response | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "" -ForegroundColor Red
    Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Code HTTP: $statusCode" -ForegroundColor Red
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Reponse: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Impossible de lire la reponse d'erreur" -ForegroundColor Red
        }
    }
}
