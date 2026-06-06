<#
.SYNOPSIS
  Runs the Playwright suite inside Docker and archives a timestamped report.
  Intended to be invoked by Windows Task Scheduler for nightly runs.

.PARAMETER Host
  Use the host-network compose service (for internal/VPN-only targets).

.EXAMPLE
  pwsh -File scripts/run-nightly.ps1
  pwsh -File scripts/run-nightly.ps1 -UseHostNetwork
#>
param(
  [switch]$UseHostNetwork
)

$ErrorActionPreference = 'Stop'

# Always run from the qa-automation folder (parent of this script's folder).
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$logDir = Join-Path $projectDir 'nightly-runs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "run_$timestamp.log"

if (-not (Test-Path (Join-Path $projectDir 'data\users.json'))) {
  "ERROR: data/users.json not found. Create it before scheduling nightly runs." |
    Tee-Object -FilePath $logFile
  exit 1
}

$service = if ($UseHostNetwork) { 'playwright-tests-host' } else { 'playwright-tests' }

"[$timestamp] Building image..." | Tee-Object -FilePath $logFile
docker compose build 2>&1 | Tee-Object -FilePath $logFile -Append

"[$timestamp] Running tests via '$service'..." | Tee-Object -FilePath $logFile -Append
docker compose run --rm $service 2>&1 | Tee-Object -FilePath $logFile -Append
$exitCode = $LASTEXITCODE

# Archive the HTML report for this run.
$reportSrc = Join-Path $projectDir 'playwright-report'
if (Test-Path $reportSrc) {
  $reportDest = Join-Path $logDir "report_$timestamp"
  Copy-Item -Recurse -Force $reportSrc $reportDest
  "Report archived to: $reportDest" | Tee-Object -FilePath $logFile -Append
}

"[$timestamp] Finished with exit code $exitCode" | Tee-Object -FilePath $logFile -Append
exit $exitCode
