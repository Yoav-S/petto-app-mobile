# Sync client/.env EXPO_PUBLIC_* vars into EAS environments.
# Run from client/:  powershell -ExecutionPolicy Bypass -File .\scripts\sync-eas-env.ps1
#
# Does NOT upload to Play Store. Uses Test Store RevenueCat keys from .env.

$ErrorActionPreference = 'Stop'
$clientRoot = Split-Path -Parent $PSScriptRoot
Set-Location $clientRoot

$envFile = Join-Path $clientRoot '.env'
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile — copy .env.example and fill values first."
}

$wanted = @(
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'
)

$values = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $i = $line.IndexOf('=')
  if ($i -lt 1) { return }
  $name = $line.Substring(0, $i).Trim()
  $val = $line.Substring($i + 1).Trim()
  if ($wanted -contains $name -and $val) {
    $values[$name] = $val
  }
}

$missing = $wanted | Where-Object { -not $values.ContainsKey($_) }
if ($missing.Count -gt 0) {
  throw "Missing in .env: $($missing -join ', ')"
}

$environments = @('development', 'preview', 'production')
foreach ($environment in $environments) {
  foreach ($name in $wanted) {
    $val = $values[$name]
    Write-Host "→ $environment / $name"
    npx eas-cli env:create `
      --name $name `
      --value $val `
      --environment $environment `
      --visibility plaintext `
      --force `
      --non-interactive
    if ($LASTEXITCODE -ne 0) {
      throw "eas env:create failed for $environment/$name"
    }
  }
}

Write-Host ''
Write-Host 'EAS env synced. Build a standalone APK (no Play upload):'
Write-Host '  npx eas-cli build --profile preview --platform android'
