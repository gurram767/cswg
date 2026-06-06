<#
.SYNOPSIS
  Runs the Playwright suite in Docker and archives a timestamped HTML report.
  Intended to be triggered by Windows Task Scheduler for a nightly run.

.NOTES
  - Requires Docker Desktop to be running.
  - Requires qa-automation/data/users.json to exist (real credentials).
  - Override the target with:  -BaseUrl "https://other.env"
  - Use host networking (internal/VPN sites) with:  -HostNetwork
#>
param(
  [string]$BaseUrl = $env:BASE_URL,
  [switch]$HostNetwork
)

$ErrorActionPreference = "Stop"

# Resolve qa-automation/ regardless of where the task is launched from.
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$archiveDir = Join-Path $ProjectDir "reports-archive\$timestamp"
$logDir = Join-Path $ProjectDir "reports-archive"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "$timestamp.log"

if (-not (Test-Path (Join-Path $ProjectDir "data\users.json"))) {
  "[$timestamp] ERROR: data/users.json not found. Create it from data/users.example.json." |
    Tee-Object -FilePath $logFile
  exit 1
}

if ($BaseUrl) { $env:BASE_URL = $BaseUrl }
$service = if ($HostNetwork) { "playwright-tests-host" } else { "playwright-tests" }

"[$timestamp] Starting Docker test run (service: $service, BASE_URL: $($env:BASE_URL))" |
  Tee-Object -FilePath $logFile

docker compose run --rm $service *>> $logFile
$exitCode = $LASTEXITCODE

# Archive the report produced by this run.
$reportDir = Join-Path $ProjectDir "playwright-report"
if (Test-Path $reportDir) {
  New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
  Copy-Item -Path (Join-Path $reportDir "*") -Destination $archiveDir -Recurse -Force
  "[$timestamp] Report archived to: $archiveDir" | Tee-Object -FilePath $logFile -Append
}

"[$timestamp] Finished with exit code $exitCode" | Tee-Object -FilePath $logFile -Append
exit $exitCode
