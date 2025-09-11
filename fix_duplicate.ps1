$content = Get-Content "src\hooks\useDreams.ts" -Raw
$content = $content -replace "throw new Error\('Unsupported audio format: ' \+ audioBlob\.type \+ '\. Supported formats: WAV, WebM, MP3, MP4, M4A, OGG, OPUS'\)", ""
$content | Set-Content "src\hooks\useDreams.ts"
