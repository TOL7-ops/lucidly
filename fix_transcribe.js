const fs = require('fs');

// Fix pages/api/transcribe.ts
let content = fs.readFileSync('pages/api/transcribe.ts', 'utf8');

// Fix console.log statements with [] brackets
content = content.replace(/console\.log\(\[\]/g, 'console.log(');
content = content.replace(/console\.error\(\[\]/g, 'console.error(');
content = content.replace(/console\.warn\(\[\]/g, 'console.warn(');

fs.writeFileSync('pages/api/transcribe.ts', content);
console.log('Fixed console statements in pages/api/transcribe.ts');
