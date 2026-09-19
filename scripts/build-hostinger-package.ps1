param(
    [string] $OutputPath = "tmp/ordersync-hostinger.zip"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stageRoot = Join-Path $projectRoot "tmp/hostinger-package"
$publicHtml = Join-Path $stageRoot "public_html"
$resolvedTmp = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "tmp"))
$resolvedStage = [System.IO.Path]::GetFullPath($stageRoot)

if (-not $resolvedStage.StartsWith($resolvedTmp + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean a staging directory outside the project's tmp directory."
}

Push-Location (Join-Path $projectRoot "web")
try {
    $env:VITE_API_BASE_URL = "/api/v1"
    $env:VITE_APP_ENV = "prod"
    $env:VITE_ENABLE_HTTP_LOGS = "false"
    $env:VITE_USE_MSW = "false"
    $env:VITE_USE_MOCK_AUTH = "false"
    $env:VITE_USE_POLLING_CHAT = "true"
    $env:VITE_PWA_ENABLED = "true"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "The web production build failed." }
}
finally {
    Pop-Location
}

if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $publicHtml -Force | Out-Null

$releaseDirectories = @("app", "bootstrap", "config", "database", "resources", "routes", "vendor")
foreach ($directory in $releaseDirectories) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $publicHtml -Recurse
}

$releaseFiles = @("artisan", "composer.json", "composer.lock")
foreach ($file in $releaseFiles) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $publicHtml
}

Copy-Item -LiteralPath (Join-Path $projectRoot ".env.hostinger.example") -Destination (Join-Path $publicHtml ".env.example")
Copy-Item -LiteralPath (Join-Path $projectRoot "deploy/hostinger-root.htaccess") -Destination (Join-Path $publicHtml ".htaccess")

$storageDirectories = @(
    "storage/app/private",
    "storage/app/public",
    "storage/framework/cache/data",
    "storage/framework/sessions",
    "storage/framework/testing",
    "storage/framework/views",
    "storage/logs"
)
foreach ($directory in $storageDirectories) {
    New-Item -ItemType Directory -Path (Join-Path $publicHtml $directory) -Force | Out-Null
}

$releasePublic = Join-Path $publicHtml "public"
New-Item -ItemType Directory -Path $releasePublic -Force | Out-Null
Get-ChildItem -LiteralPath (Join-Path $projectRoot "public") -Force |
    Where-Object { $_.Name -ne "storage" } |
    Copy-Item -Destination $releasePublic -Recurse -Force

$webDist = Join-Path $projectRoot "web/dist"
Get-ChildItem -LiteralPath $webDist -Force |
    Where-Object { $_.Name -ne "index.html" } |
    Copy-Item -Destination $releasePublic -Recurse -Force

$spaDirectory = Join-Path $releasePublic "app"
New-Item -ItemType Directory -Path $spaDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $webDist "index.html") -Destination (Join-Path $spaDirectory "index.html") -Force

$output = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputPath))
if (-not $output.StartsWith($resolvedTmp + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "OutputPath must stay inside the project's tmp directory."
}
if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}
& tar.exe -a -c -f $output -C $stageRoot .
if ($LASTEXITCODE -ne 0) { throw "The Hostinger archive could not be created." }

Write-Host "Hostinger package created: $output"
Write-Host "Upload it to the website root, extract it, create .env from .env.example, then run the deployment commands in docs/HOSTINGER_DEPLOYMENT.md."
