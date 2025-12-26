import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IGN = new Set([ 'AI_AUDIT', 'node_modules', '.git', 'dist', 'build', 'out', 'coverage', '.next', '.turbo']);

let errors = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (IGN.has(e.name) || e.name === 'TEST_AUDIT_REPORT.md') continue;
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

    // 1. Check code blocks ```bash ... ```
    const blockRegex = /```bash\n([\s\S]*?)```/g;
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
        const snippet = match[1];
        validateNpmRun(snippet, relPath);
    }

    // 2. Check inline snippets `npm run ...`
    const inlineRegex = /`([^`]+)`/g;
    while ((match = inlineRegex.exec(content)) !== null) {
        const snippet = match[1];
        if (snippet.includes('npm run')) {
            validateNpmRun(snippet, relPath);
        }
    }
}

function validateNpmRun(text, relPath) {
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Regex to catch "npm run <script>"
        // Handles: npm run test, npm run test:coverage, npm run lint -- --fix
        const npmRunMatch = /npm\s+run\s+([\w\-\:\.]+)/.exec(trimmed);

        if (npmRunMatch) {
            const scriptName = npmRunMatch[1];
            const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

            if (!pkg.scripts || !pkg.scripts[scriptName]) {
                console.error(`DOCS_CHECK_SNIPPETS_FAIL: ${relPath} references missing script 'npm run ${scriptName}'`);
                errors++;
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
