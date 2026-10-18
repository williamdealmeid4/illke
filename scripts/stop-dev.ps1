$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$pattern = [regex]::Escape($projectRoot)
$allProcesses = @(Get-CimInstance Win32_Process)
$projectProcesses = @($allProcesses | Where-Object {
    $_.Name -in @('node.exe', 'php.exe') -and $_.CommandLine -match $pattern
})
$parentIds = @($projectProcesses | Select-Object -ExpandProperty ParentProcessId -Unique)
$allProcesses | Where-Object { $_.ProcessId -in $parentIds -and $_.Name -eq 'node.exe' -and $_.CommandLine -match 'scripts[\\/]dev\.mjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
$projectProcesses | ForEach-Object {
    Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
}
Write-Output 'Serviços deste projeto encerrados.'
