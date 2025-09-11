# PowerShell script to fix template literal syntax errors in src/lib/api.ts
$content = Get-Content 'src/lib/api.ts' -Raw

# Fix template literals
$content = $content -replace 'const response = await fetch\(\$\{API_BASE\}', 'const response = await fetch(`${API_BASE}'
$content = $content -replace 'error: Server returned invalid JSON\. Status: \. Response: \.\.\.', 'error: `Server returned invalid JSON. Status: ${response.status}. Response: ${responseText}...`'
$content = $content -replace 'let errorMessage = data\.error \|\| HTTP :', 'let errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`'
$content = $content -replace 'errorMessage = Server error \(\):', 'errorMessage = `Server error (${response.status}): ${data.error || response.statusText}`'
$content = $content -replace 'error: Unsupported audio format: \. Please use WAV, WebM, MP3, MP4, M4A, OGG, or OPUS\.', 'error: `Unsupported audio format: ${audioBlob.type}. Please use WAV, WebM, MP3, MP4, M4A, OGG, or OPUS.`'
$content = $content -replace 'const response = await fetch\(\$\{API_BASE\}/transcribe', 'const response = await fetch(`${API_BASE}/transcribe'
$content = $content -replace 'error: Server returned invalid JSON\. Status: \. Response: \.\.\.', 'error: `Server returned invalid JSON. Status: ${response.status}. Response: ${responseText}...`'
$content = $content -replace 'error: data\.error \|\| Server error \(\):', 'error: data.error || `Server error (${response.status}): ${data.error || response.statusText}`'
$content = $content -replace 'error: error instanceof Error \? Network error:  : '\''Unknown network error occurred'\''', 'error: error instanceof Error ? `Network error: ${error.message}` : `Unknown network error occurred`'

Set-Content 'src/lib/api.ts' -Value $content -Encoding UTF8
Write-Host "Fixed template literals in src/lib/api.ts"
