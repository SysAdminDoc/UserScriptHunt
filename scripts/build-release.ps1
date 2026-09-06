$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$package = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'package.json') | ConvertFrom-Json
$version = [string]$package.version
$distPath = Join-Path $repoRoot 'dist'
$stagePath = Join-Path $distPath "ScriptHunt-v$version"
$zipPath = Join-Path $distPath "ScriptHunt-v$version.zip"
$checksumPath = Join-Path $distPath "ScriptHunt-v$version.sha256.txt"

if (Test-Path -LiteralPath $distPath) {
    Remove-Item -Recurse -Force -LiteralPath $distPath
}
New-Item -ItemType Directory -Force -Path $stagePath | Out-Null

$rootFiles = @(
    'index.html',
    'manifest.json',
    'sw.js',
    'icon.png',
    'icon-32.png',
    'icon-180.png',
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-512.png',
    'LICENSE',
    'README.md'
)

foreach ($relativePath in $rootFiles) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $relativePath) -Destination (Join-Path $stagePath $relativePath)
}

foreach ($directory in @('fonts', 'assets', 'cors-proxy')) {
    $destination = Join-Path $stagePath $directory
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -Recurse -Force -Path (Join-Path $repoRoot $directory '*') -Destination $destination
}

Compress-Archive -Path (Join-Path $stagePath '*') -DestinationPath $zipPath -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$requiredEntries = @(
    'index.html',
    'manifest.json',
    'sw.js',
    'assets/brand/scripthunt-mark.png',
    'assets/screenshots/02-results.png',
    'assets/social-preview.png'
)
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
    foreach ($entry in $requiredEntries) {
        if ($entryNames -notcontains $entry) {
            throw "Release archive is missing $entry"
        }
    }
}
finally {
    $archive.Dispose()
}

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash
"$hash  $(Split-Path -Leaf $zipPath)" | Set-Content -NoNewline -Encoding ascii -LiteralPath $checksumPath

Write-Output "Built $zipPath"
Write-Output "SHA256 $hash"
