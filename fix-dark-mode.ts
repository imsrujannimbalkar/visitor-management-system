import fs from 'fs';

function addDarkMode(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace bg-white with bg-white dark:bg-gray-800
  content = content.replace(/bg-white(?! dark:bg-gray-800)/g, 'bg-white dark:bg-gray-800');
  
  // Replace text-gray-900 with text-gray-900 dark:text-white
  content = content.replace(/text-gray-900(?! dark:text-white)/g, 'text-gray-900 dark:text-white');
  
  // Replace border-gray-100 with border-gray-100 dark:border-gray-700
  content = content.replace(/border-gray-100(?! dark:border-gray-700)/g, 'border-gray-100 dark:border-gray-700');
  
  // Replace border-gray-200 with border-gray-200 dark:border-gray-700
  content = content.replace(/border-gray-200(?! dark:border-gray-700)/g, 'border-gray-200 dark:border-gray-700');

  // Replace bg-gray-50 with bg-gray-50 dark:bg-gray-900
  content = content.replace(/bg-gray-50(?! dark:bg-gray-900)/g, 'bg-gray-50 dark:bg-gray-900');

  // Replace text-gray-500 with text-gray-500 dark:text-gray-400
  content = content.replace(/text-gray-500(?! dark:text-gray-400)/g, 'text-gray-500 dark:text-gray-400');

  // Replace text-gray-600 with text-gray-600 dark:text-gray-300
  content = content.replace(/text-gray-600(?! dark:text-gray-300)/g, 'text-gray-600 dark:text-gray-300');

  // Replace text-gray-700 with text-gray-700 dark:text-gray-200
  content = content.replace(/text-gray-700(?! dark:text-gray-200)/g, 'text-gray-700 dark:text-gray-200');

  // Replace bg-slate-50 with bg-slate-50 dark:bg-gray-900
  content = content.replace(/bg-slate-50(?! dark:bg-gray-900)/g, 'bg-slate-50 dark:bg-gray-900');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

addDarkMode('src/App.tsx');
addDarkMode('src/components/VisitorForm.tsx');
