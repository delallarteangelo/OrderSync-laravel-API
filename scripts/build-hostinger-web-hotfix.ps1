param(
    [string] $OutputPath = "tmp/ordersync-web-hotfix.zip"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$tmpRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "tmp"))
$stageRoot = [System.IO.Path]::GetFullPath((Join-Path $tmpRoot "hostinger-web-hotfix"))
$output = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputPath))

foreach ($path in @($stageRoot, $output)) {
    if (-not $path.StartsWith($tmpRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Hotfix paths must stay inside the project's tmp directory."
    }
}

if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$webDist = Join-Path $projectRoot "web/dist"
Get-ChildItem -LiteralPath $webDist -Force |
    Where-Object { $_.Name -ne "index.html" } |
    Copy-Item -Destination $stageRoot -Recurse -Force

$spaDirectory = Join-Path $stageRoot "app"
New-Item -ItemType Directory -Path $spaDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $webDist "index.html") -Destination (Join-Path $spaDirectory "index.html") -Force

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}
& tar.exe -a -c -f $output -C $stageRoot .
if ($LASTEXITCODE -ne 0) { throw "The web hotfix archive could not be created." }

Write-Host "Hostinger web hotfix created: $output"
Write-Host "Upload and extract its contents directly inside public_html/public."

