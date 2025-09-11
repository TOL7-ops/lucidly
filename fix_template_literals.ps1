$content = Get-Content "pages/api/transcribe.ts" -Raw

# Fix template literals
$content = $content -replace "Normalized MIME type: ", "\`Normalized MIME type: \${normalizedMimeType}\`"
$content = $content -replace "Calling transcription service\.\.\.", "\'Calling transcription service...\'"
$content = $content -replace "Transcription completed successfully in ms", "\`Transcription completed successfully in \${duration}ms\`"
$content = $content -replace "Transcript preview:, transcript\.substring\(0, 100\) \+ \(transcript\.length > 100 \? '\.\.\.' : ''\)", "\`Transcript preview: \${transcript.substring(0, 100) + (transcript.length > 100 ? \"...\" : \"\")}\`"
$content = $content -replace "Temporary file cleaned up successfully", "\'Temporary file cleaned up successfully\'"
$content = $content -replace "Failed to clean up temporary file:, cleanupError", "\`Failed to clean up temporary file: \${cleanupError}\`"
$content = $content -replace "Transcription service returned error:, transcript", "\`Transcription service returned error: \${transcript}\`"
$content = $content -replace "Transcription failed after ms:, transcriptionError", "\`Transcription failed after \${duration}ms: \${transcriptionError}\`"
$content = $content -replace "Hugging Face API error: ", "\`Hugging Face API error: \${transcriptionError.message}\`"
$content = $content -replace "Transcription failed: ", "\`Transcription failed: \${transcriptionError instanceof Error ? transcriptionError.message : \"Unknown error\"}\`"
$content = $content -replace "Transcription endpoint error:, error", "\`Transcription endpoint error: \${error}\`"
$content = $content -replace "Error stack:, error instanceof Error \? error\.stack : 'No stack trace available'", "\`Error stack: \${error instanceof Error ? error.stack : \"No stack trace available\"}\`"
$content = $content -replace "Full error details:, \{", "\'Full error details:\', \{"
$content = $content -replace "Internal server error: ", "\`Internal server error: \${errorMessage}\`"

$content | Set-Content "pages/api/transcribe.ts"
