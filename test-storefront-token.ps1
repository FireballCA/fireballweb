# Test rapide du token Storefront API
$token = "430660c1be152b6ba4fe92097b5ee08c"
$url = "https://fireball-canada.myshopify.com/api/2024-10/graphql.json"

$query = @{
    query = "{ shop { name } }"
} | ConvertTo-Json

Write-Host "Test du token Storefront API..." -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0, 10))..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
        "Content-Type" = "application/json"
        "X-Shopify-Storefront-Access-Token" = $token
    } -Body $query
    
    Write-Host "[SUCCES] Token valide!" -ForegroundColor Green
    Write-Host "Reponse:" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "[ERREUR] Token invalide" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Code HTTP: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Reponse: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Impossible de lire la reponse" -ForegroundColor Red
        }
    }
}
