# PowerShell script to fix template literal syntax errors in src/lib/huggingface.ts
$content = Get-Content 'src/lib/huggingface.ts' -Raw

# Fix console.log statements
$content = $content -replace 'console\.log\(Attempt  failed, retrying in ms\.\.\.\)', 'console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)'
$content = $content -replace 'console\.log\(Trying summarization with model: \)', 'console.log(`Trying summarization with model: ${model}`)'
$content = $content -replace 'console\.log\(Trying sentiment analysis with model: \)', 'console.log(`Trying sentiment analysis with model: ${model}`)'
$content = $content -replace 'console\.log\(Trying dream interpretation with model: \)', 'console.log(`Trying dream interpretation with model: ${model}`)'
$content = $content -replace 'console\.log\(Transcription successful with model :, transcript\.substring\(0, 100\) \+ '\''\.\.\.''\'\)', 'console.log(`Transcription successful with model ${model}: ${transcript.substring(0, 100)}...`)'

# Fix fetch URLs
$content = $content -replace 'const response = await fetch\(\$\{HF_API_BASE\}/', 'const response = await fetch(`${HF_API_BASE}/'

# Fix error messages
$content = $content -replace 'let errorMessage = HTTP :', 'let errorMessage = `HTTP ${response.status}: ${response.statusText}`'
$content = $content -replace 'errorMessage = HTTP :', 'errorMessage = `HTTP ${response.status}: ${response.statusText}`'

Set-Content 'src/lib/huggingface.ts' -Value $content -Encoding UTF8
Write-Host "Fixed template literals in src/lib/huggingface.ts"
