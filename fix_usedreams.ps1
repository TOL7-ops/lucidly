# PowerShell script to fix template literal syntax errors
$content = Get-Content 'src/hooks/useDreams.ts' -Raw

# Fix the main broken template literal in useDreams.ts
$content = $content -replace 'throw new Error\(Unsupported audio format: \. Supported formats: WAV, WebM, MP3, MP4, M4A, OGG, OPUS\)', 'throw new Error(`Unsupported audio format: ${audioBlob.type}. Supported formats: WAV, WebM, MP3, MP4, M4A, OGG, OPUS`)'

Set-Content 'src/hooks/useDreams.ts' -Value $content -Encoding UTF8
Write-Host "Fixed template literal in src/hooks/useDreams.ts"
