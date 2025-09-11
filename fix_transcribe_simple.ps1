# PowerShell script to fix template literal syntax errors in transcribe.ts (simplified)
$content = Get-Content 'pages/api/transcribe.ts' -Raw

# Fix simple cases first
$content = $content -replace 'console\.log\( Normalized MIME type: \)', 'console.log(`Normalized MIME type: ${normalizedMimeType}`)'
$content = $content -replace 'console\.log\( Calling transcription service\.\.\.\)', 'console.log(`Calling transcription service...`)'
$content = $content -replace 'console\.log\( Transcription completed successfully in ms\)', 'console.log(`Transcription completed successfully in ${duration}ms`)'
$content = $content -replace 'console\.log\( Temporary file cleaned up successfully\)', 'console.log(`Temporary file cleaned up successfully`)'

Set-Content 'pages/api/transcribe.ts' -Value $content -Encoding UTF8
Write-Host "Fixed basic template literals in pages/api/transcribe.ts"
