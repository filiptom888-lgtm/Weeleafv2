$ErrorActionPreference = "Stop"
$Host = "92.113.18.31"
$Port = "65002"
$User = "u769128625"
$Remote = "${User}@${Host}"
$WebRoot = "domains/weeleaf.com/public_html"
$Project = "C:\Users\onio8\weeleaf\Weeleafv2"

Set-Location $Project
Write-Host "Building..." -ForegroundColor Cyan
npm run build | Out-Null

Write-Host "Uploading frontend..." -ForegroundColor Cyan
scp -P $Port -o BatchMode=yes -r dist/index.html dist/assets "${Remote}:${WebRoot}/"

Write-Host "Uploading API..." -ForegroundColor Cyan
scp -P $Port -o BatchMode=yes -r api "${Remote}:${WebRoot}/"

Write-Host "Configuring on server..." -ForegroundColor Cyan
$remoteScript = @'
cd ~/domains/weeleaf.com/public_html/api
if [ ! -f config.local.php ]; then cp config.local.php.example config.local.php; fi
grep -q "YOUR_DATABASE_PASSWORD" config.local.php && echo "NEEDS_DB_PASSWORD" || echo "CONFIG_OK"
'@
ssh -p $Port -o BatchMode=yes $Remote $remoteScript

Write-Host "Done." -ForegroundColor Green
