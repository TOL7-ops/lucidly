# PowerShell script to fix template literal syntax errors in transcribe.ts
$content = Get-Content 'pages/api/transcribe.ts' -Raw

# Fix console.log statements with template literals
$content = $content -replace 'console\.log\( Normalized MIME type: \)', 'console.log(`Normalized MIME type: ${normalizedMimeType}`)'
$content = $content -replace 'console\.log\( Calling transcription service\.\.\.\)', 'console.log(`Calling transcription service...`)'
$content = $content -replace 'console\.log\( Transcription completed successfully in ms\)', 'console.log(`Transcription completed successfully in ${duration}ms`)'
$content = $content -replace 'console\.log\( Transcript preview:, transcript\.substring\(0, 100\) \+ \(transcript\.length > 100 \? '\''\.\.\.''\' : '\'''\''\)\)', 'console.log(`Transcript preview: ${transcript.substring(0, 100) + (transcript.length > 100 ? "..." : "")}`)'
$content = $content -replace 'console\.log\( Temporary file cleaned up successfully\)', 'console.log(`Temporary file cleaned up successfully`)'
$content = $content -replace 'console\.warn\( Failed to clean up temporary file:, cleanupError\)', 'console.warn(`Failed to clean up temporary file: ${cleanupError}`)'
$content = $content -replace 'console\.error\( Transcription service returned error:, transcript\)', 'console.error(`Transcription service returned error: ${transcript}`)'
$content = $content -replace 'console\.error\( Transcription failed after ms:, transcriptionError\)', 'console.error(`Transcription failed after ${duration}ms: ${transcriptionError}`)'
$content = $content -replace 'console\.error\( Transcription endpoint error:, error\)', 'console.error(`Transcription endpoint error: ${error}`)'
$content = $content -replace 'console\.error\( Error stack:, error instanceof Error \? error\.stack : '\''No stack trace available'\''\)', 'console.error(`Error stack: ${error instanceof Error ? error.stack : "No stack trace available"}`)'
$content = $content -replace 'console\.error\( Full error details:, \{', 'console.error(`Full error details:`, {'

# Fix error messages with template literals
$content = $content -replace 'Hugging Face API error: ', '`Hugging Face API error: ${transcriptionError.message}`'
$content = $content -replace 'Transcription failed: ', '`Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : "Unknown error"}`'
$content = $content -replace 'Internal server error: ', '`Internal server error: ${errorMessage}`'

Set-Content 'pages/api/transcribe.ts' -Value $content -Encoding UTF8
Write-Host "Fixed template literals in pages/api/transcribe.ts"
