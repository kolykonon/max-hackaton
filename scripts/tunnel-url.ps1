$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $logs = docker compose --profile tunnel logs --no-color --tail=200 tunnel 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось прочитать логи Docker Compose.' }
    $urls = [regex]::Matches(($logs -join "`n"), 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($urls.Count -eq 0) {
        throw 'HTTPS-адрес ещё не получен. Запустите docker compose --profile tunnel up --build и повторите через несколько секунд; проверьте логи tunnel.'
    }
    $urls[$urls.Count - 1].Value
} finally {
    Pop-Location
}
