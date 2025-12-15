import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
            checkSnippets(fullPath);
        }
    }
}

function checkSnippets(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(ROOT, filePath);

    // Regex for ```bash ... ```
    const regex = /```bash\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const snippet = match[1].trim();
        const lines = snippet.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Check for npm run ...
            if (trimmed.startsWith('npm run ')) {
                const scriptName = trimmed.split(' ')[2]; // npm run <script>
                if (!scriptName) continue;

                // Remove flags like -- --help
                const cleanScriptName = scriptName.split(' ')[0];

                // Read package.json again to be safe
                const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
                if (!pkg.scripts || !pkg.scripts[cleanScriptName]) {
                    console.error(`DOCS_CHECK_SNIPPETS_FAIL: ${relPath} references missing script 'npm run ${cleanScriptName}'`);
                    errors++;
                } else {
                     // Optionally dry-run? No, strict verification of existence is Phase 1 level.
                     // Running them might be dangerous (e.g. npm install).
                }
            }
        }
    }
}

console.log('Scanning for broken snippets...');
walk(ROOT);

if (errors > 0) {
    console.error(`FAILED: Found ${errors} broken snippets.`);
    process.exit(1);
} else {
    console.log('SUCCESS: No broken snippets found.');
}
