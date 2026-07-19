# WeeLeaf Hostinger deploy — run from project root in PowerShell
# You will be asked for your SSH password (twice: dist + api upload)

$ErrorActionPreference = "Stop"
$Host = "92.113.18.31"
$Port = "65002"
$User = "u769128625"
$Remote = "${User}@${Host}"

# Hostinger path — change if your domain folder is different
$WebRoot = "domains/weeleaf.com/public_html"

Write-Host "Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

Write-Host "Uploading frontend (dist)..." -ForegroundColor Cyan
scp -P $Port -r dist/index.html dist/assets "${Remote}:${WebRoot}/"

Write-Host "Uploading wl-config.json..." -ForegroundColor Cyan
scp -P $Port dist/wl-config.json "${Remote}:${WebRoot}/wl-config.json"

Write-Host "Uploading API..." -ForegroundColor Cyan
scp -P $Port -r api "${Remote}:${WebRoot}/"

Write-Host ""
Write-Host "Done uploading." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT — SSH in and finish setup:" -ForegroundColor Yellow
Write-Host "  ssh -p $Port $Remote"
Write-Host ""
Write-Host "Then run these on the server:" -ForegroundColor Yellow
Write-Host @"

cd ~/domains/weeleaf.com/public_html/api
cp config.local.php.example config.local.php
nano config.local.php
# Set db_pass and install_key, save (Ctrl+O, Enter, Ctrl+X)

php -r "echo file_get_contents('http://localhost/api/install.php');" 2>/dev/null || true

"@
