# Script PowerShell pour creer un Storefront API Access Token
# Usage: .\create-storefront-token.ps1

# Lire les variables depuis .env
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
$clientSecret = $envVars['SHOPIFY_CLIENT_SECRET']

if (-not $store) {
    Write-Host "[ERREUR] VITE_SHOPIFY_STORE_URL non trouve dans .env" -ForegroundColor Red
    exit 1
}

if (-not $clientId -or -not $clientSecret) {
    Write-Host "[ERREUR] SHOPIFY_CLIENT_ID et SHOPIFY_CLIENT_SECRET doivent etre dans .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ajoutez ces lignes dans votre fichier .env:" -ForegroundColor Yellow
    Write-Host "SHOPIFY_CLIENT_ID=votre-client-id" -ForegroundColor Yellow
    Write-Host "SHOPIFY_CLIENT_SECRET=votre-client-secret" -ForegroundColor Yellow
    exit 1
}

# Ajouter https:// si manquant
if (-not $store.StartsWith("http")) {
    $store = "https://$store"
}

$url = "$store/admin/api/2024-01/storefront_access_tokens.json"
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${clientId}:${clientSecret}"))

Write-Host "[INFO] Creation du Storefront API Access Token..." -ForegroundColor Cyan
Write-Host "Store: $store" -ForegroundColor Gray
Write-Host ""

$body = @{
    storefront_access_token = @{
        title = "Fireball Web App - Storefront Token"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Basic $credentials"
    } -Body $body

    $token = $response.storefront_access_token.access_token
    
    if ($token) {
        Write-Host "[SUCCES] Token cree avec succes!" -ForegroundColor Green
        Write-Host ""
        Write-Host "[ACTION] Ajoutez cette ligne dans votre fichier .env:" -ForegroundColor Yellow
        Write-Host "VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=$token" -ForegroundColor White
        Write-Host ""
        Write-Host "[ATTENTION] N'oubliez pas de redemarrer votre serveur de developpement apres!" -ForegroundColor Yellow
    } else {
        Write-Host "[ERREUR] Token non trouve dans la reponse" -ForegroundColor Red
        Write-Host $response | ConvertTo-Json -Depth 10
    }
} catch {
    Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Reponse: $responseBody" -ForegroundColor Red
    }
}
