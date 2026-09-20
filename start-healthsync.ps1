$ErrorActionPreference = "Stop"

# Starts every HealthSync backend service required before running the Vite frontend.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $projectRoot "Healthsync-backend"
$bundledPython = "C:\Users\mnava\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$pythonExecutable = if (Test-Path $bundledPython) { $bundledPython } else { "python" }

function Start-HealthSyncService {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory
    )

    Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $projectRoot "$Name.out.log") `
        -RedirectStandardError (Join-Path $projectRoot "$Name.err.log") | Out-Null
}

function Test-HealthSyncPort {
    param([int]$Port)
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect("127.0.0.1", $Port); return $true }
    catch { return $false }
    finally { $client.Dispose() }
}

if (-not (Test-HealthSyncPort 8082)) { Start-HealthSyncService -Name "user-service" -FilePath "java" -ArgumentList @("-jar", "target\\user-service-0.0.1-SNAPSHOT.jar") -WorkingDirectory (Join-Path $backendRoot "user-service") }
if (-not (Test-HealthSyncPort 8083)) { Start-HealthSyncService -Name "health-service" -FilePath "java" -ArgumentList @("-jar", "target\\health-service-0.0.1-SNAPSHOT.jar") -WorkingDirectory (Join-Path $backendRoot "health-service") }
if (-not (Test-HealthSyncPort 8084)) { Start-HealthSyncService -Name "ml-service" -FilePath $pythonExecutable -ArgumentList @("app.py") -WorkingDirectory (Join-Path $backendRoot "ml-service") }
if (-not (Test-HealthSyncPort 8081)) { Start-HealthSyncService -Name "gateway" -FilePath "node" -ArgumentList @("index.js") -WorkingDirectory (Join-Path $backendRoot "gateway") }

Start-Sleep -Seconds 15
Write-Host "HealthSync services are starting: Gateway 8081, User 8082, Health 8083, ML 8084."
Write-Host "Wait 10 seconds, then start the frontend with: cd '$projectRoot\\HealthSync frontend\\frontend'; npm.cmd run dev"
