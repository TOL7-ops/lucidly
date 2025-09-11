$content = Get-Content "pages/api/transcribe.ts" -Raw
$content = $content -replace "console\.log\(\[\]", "console.log("
$content = $content -replace "console\.error\(\[\]", "console.error("
$content = $content -replace "console\.warn\(\[\]", "console.warn("
$content | Set-Content "pages/api/transcribe.ts"
