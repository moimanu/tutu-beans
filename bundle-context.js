const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'project_context.txt';
const EXCLUDE_DIRS = ['node_modules', '.git', '.obsidian', 'dist', 'tests'];
const EXCLUDE_FILES = [
    'package-lock.json', 
    'project_context.txt', 
    'main.js', 
    'data.json',
    '.env'
];
const ALLOWED_EXTENSIONS = ['.ts', '.js', '.json', '.css', '.md', '.mjs'];

let fullContent = "";

function readFilesRecursively(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                readFilesRecursively(filePath);
            }
        } else {
            const ext = path.extname(file);
            const isAllowed = ALLOWED_EXTENSIONS.includes(ext);
            const isNotExcluded = !EXCLUDE_FILES.includes(file);

            if (isAllowed && isNotExcluded) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    fullContent += `\n${"=".repeat(60)}\n`;
                    fullContent += `FILE: ${filePath}\n`;
                    fullContent += `${"=".repeat(60)}\n\n`;
                    
                    fullContent += content;
                    fullContent += `\n\n`; 
                    
                    console.log(`✅ Added: ${filePath}`);
                } catch (err) {
                    console.error(`❌ Error reading ${filePath}: ${err.message}`);
                }
            }
        }
    });
}

console.log("🚀 Starting project context compilation...");

readFilesRecursively('.');

try {
    fs.writeFileSync(OUTPUT_FILE, fullContent);
    
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✨ Done! Context saved to: ${OUTPUT_FILE} (${fileSizeMB} MB)`);
} catch (err) {
    console.error(`\n❌ Failed to write output file: ${err.message}`);
}
