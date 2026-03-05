# Install resend-cli from GitHub Releases (Windows).
# Usage (PowerShell): irm https://raw.githubusercontent.com/shubhdeep12/resend-cli/main/scripts/install.ps1 | iex
# Or: irm ... | iex -InstallDir "$env:LOCALAPPDATA\Programs\resend-cli"
param(
  [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"
$Repo = "shubhdeep12/resend-cli"
$ApiUrl = "https://api.github.com/repos/$Repo/releases/latest"

# Detect platform: win-x64 or win-arm64
$arch = if ($env:PROCESSOR_ARCHITECTURE -match "ARM64") { "arm64" } else { "x64" }
$platform = "win-$arch"

if (-not $InstallDir) {
  $InstallDir = Join-Path $env:LOCALAPPDATA "Programs\resend-cli"
}
$binDir = $InstallDir
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }

Write-Host "Installing resend-cli for $platform into $InstallDir"

try {
  $release = Invoke-RestMethod -Uri $ApiUrl -Headers @{
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "resend-cli-installer"
  }
} catch {
  Write-Error "Failed to fetch release info. Install with Node.js: npm install -g @shubhdeep12/resend-cli"
  exit 1
}

$tag = $release.tag_name
$version = $tag.TrimStart("v")
$asset = $release.assets | Where-Object { $_.name -like "*$platform*" } | Select-Object -First 1

if (-not $asset) {
  Write-Error "No pre-built binary for $platform. Install with Node.js: npm install -g @shubhdeep12/resend-cli"
  Write-Host "Or download manually: https://github.com/$Repo/releases/latest"
  exit 1
}

$downloadUrl = $asset.browser_download_url
$outPath = Join-Path $env:TEMP $asset.name

Write-Host "Downloading $($asset.name)..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $outPath -UseBasicParsing

$exeDest = Join-Path $binDir "resend.exe"
if ($asset.name -match '\.zip$') {
  $extractDir = Join-Path $env:TEMP "resend-cli-extract"
  if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
  Expand-Archive -Path $outPath -DestinationPath $extractDir -Force
  $exe = Get-ChildItem -Path $extractDir -Recurse -Filter "resend*.exe" | Select-Object -First 1
  if (-not $exe) { $exe = Get-ChildItem -Path $extractDir -Recurse -File | Select-Object -First 1 }
  if ($exe) { Copy-Item $exe.FullName -Destination $exeDest -Force }
  Remove-Item -Recurse -Force $extractDir -ErrorAction SilentlyContinue
} else {
  Copy-Item $outPath -Destination $exeDest -Force
}
Remove-Item $outPath -Force -ErrorAction SilentlyContinue

Write-Host "Installed: $exeDest"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$binDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$binDir", "User")
  Write-Host "Added to user PATH. Restart the terminal or run: `$env:Path += `";$binDir`""
}
& $exeDest --version 2>$null
