# PowerShell script to fix template literal syntax errors in src/lib/api.ts
$content = Get-Content 'src/lib/api.ts' -Raw

# Fix basic template literals
$content = $content -replace 'const response = await fetch\(\$\{API_BASE\}', 'const response = await fetch(`${API_BASE}'
$content = $content -replace 'let errorMessage = data\.error \|\| HTTP :', 'let errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`'
$content = $content -replace 'const response = await fetch\(\$\{API_BASE\}/transcribe', 'const response = await fetch(`${API_BASE}/transcribe'

Set-Content 'src/lib/api.ts' -Value $content -Encoding UTF8
Write-Host "Fixed basic template literals in src/lib/api.ts"
