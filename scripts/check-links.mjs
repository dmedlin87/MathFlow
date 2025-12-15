import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IGN = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'coverage', '.next', '.turbo']);

let errors = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (IGN.has(e.name)) continue;
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
            walk(fullPath);
        } else if (e.name.endsWith('.md')) {
            checkFile(fullPath);
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(ROOT, filePath);
    // basic link regex: [text](path)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const link = match[2];
        if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) continue;
        
        // Resolve local link
        let targetPath;
        if (link.startsWith('/')) {
            targetPath = path.join(ROOT, link);
        } else {
            targetPath = path.join(path.dirname(filePath), link);
        }

        // Clean query/hash
        targetPath = targetPath.split('#')[0].split('?')[0];

        if (!fs.existsSync(targetPath)) {
            console.error(`ERROR: Broken link in ${relPath}: ${link} -> ${targetPath} not found.`);
            errors++;
        }
    }
}

console.log('Scanning for broken local links...');
walk(ROOT);

if (errors > 0) {
    console.error(`FAILED: Found ${errors} broken links.`);
    process.exit(1);
} else {
    console.log('SUCCESS: No broken local links found.');
}
