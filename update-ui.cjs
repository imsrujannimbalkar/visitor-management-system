const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Typography
  content = content.replace(/font-black/g, 'font-semibold');
  content = content.replace(/text-\[10px\] uppercase tracking-widest/g, 'text-xs font-medium text-gray-500');
  content = content.replace(/uppercase tracking-widest text-\[10px\]/g, 'text-xs font-medium text-gray-500');
  content = content.replace(/text-\[10px\] font-semibold uppercase tracking-widest/g, 'text-xs font-medium text-gray-500');
  content = content.replace(/text-xs font-semibold text-gray-500 uppercase tracking-widest/g, 'text-sm font-medium text-gray-600');
  content = content.replace(/text-xs font-semibold uppercase tracking-widest/g, 'text-sm font-medium text-gray-600');
  
  // Borders and Radius
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-2xl/g, 'rounded-lg');
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
  content = content.replace(/border-2/g, 'border');
  
  // Shadows
  content = content.replace(/shadow-2xl/g, 'shadow-lg');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done');
