param([int]$Port = 4180)
$ErrorActionPreference = 'Stop'
$projectPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspacePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
if (-not $env:CRM_PGLITE_MODULE) {
    $dependencyPath = Join-Path $workspacePath 'tmp/crm-auth-test/node_modules/@electric-sql/pglite/dist/index.js'
    if (Test-Path -LiteralPath $dependencyPath) { $env:CRM_PGLITE_MODULE = $dependencyPath }
}
if (-not $env:CRM_PGLITE_MODULE -or -not (Test-Path -LiteralPath $env:CRM_PGLITE_MODULE)) {
    throw 'Defina CRM_PGLITE_MODULE com a ferramenta PGlite de testes. Consulte homologacao/README.md.'
}
$env:CRM_RECORDS_HOMOLOGATION = 'local'
$env:CRM_PORT = [string]$Port
Push-Location -LiteralPath $projectPath
try { node homologacao/server.mjs } finally { Pop-Location }
