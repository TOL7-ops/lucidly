# PowerShell script to fix remaining template literal syntax errors in huggingface.ts (simplified)
$content = Get-Content 'src/lib/huggingface.ts' -Raw

# Fix console statements with empty placeholders (simpler patterns)
$content = $content -replace 'console\.warn\(Summarization model  failed:, response\.status, response\.statusText\)', 'console.warn(`Summarization model ${model} failed: ${response.status} ${response.statusText}`)'
$content = $content -replace 'console\.warn\(Sentiment model  failed:, response\.status, response\.statusText\)', 'console.warn(`Sentiment model ${model} failed: ${response.status} ${response.statusText}`)'
$content = $content -replace 'console\.warn\(Interpretation model  failed:, response\.status, response\.statusText\)', 'console.warn(`Interpretation model ${model} failed: ${response.status} ${response.statusText}`)'
$content = $content -replace 'console\.warn\(Model  returned empty transcript:, result\)', 'console.warn(`Model ${model} returned empty transcript: ${result}`)'
$content = $content -replace 'console\.error\(Error with model :, error\.message\)', 'console.error(`Error with model ${model}: ${error.message}`)'

# Fix error messages with template literals
$content = $content -replace 'throw new Error\(Authentication failed: Invalid or expired API key\)', 'throw new Error(`Authentication failed: Invalid or expired API key`)'
$content = $content -replace 'throw new Error\(Access forbidden: \)', 'throw new Error(`Access forbidden: ${response.statusText}`)'
$content = $content -replace 'throw new Error\(Rate limit exceeded: \)', 'throw new Error(`Rate limit exceeded: ${response.statusText}`)'
$content = $content -replace 'throw new Error\(Server error: \)', 'throw new Error(`Server error: ${response.statusText}`)'
$content = $content -replace 'throw new Error\(Request failed: \)', 'throw new Error(`Request failed: ${response.statusText}`)'

Set-Content 'src/lib/huggingface.ts' -Value $content -Encoding UTF8
Write-Host "Fixed remaining template literals in src/lib/huggingface.ts"
