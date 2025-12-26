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
            checkFile(fullPath);
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(ROOT, filePath);

    // 1. Check standard Markdown links: [text](path)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        verifyLink(match[2], relPath, filePath);
    }

    // 2. Check plain text file paths: src/...
    // Matches "src/..." followed by word chars, extension, allowing - and /
    // Excluding obvious code blocks if possible, but simple regex is usually enough for "mentioned paths"
    const pathRegex = /\b(src\/[\w\-\/]+\.[a-z]+)\b/g;
    while ((match = pathRegex.exec(content)) !== null) {
        // Avoid double-checking if it was part of a markdown link captured above?
        // Actually, verifying existence twice is cheap.
        verifyPath(match[1], relPath);
    }
}

function verifyLink(link, relPath, filePath) {
    if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) return;

    let targetPath;
    if (link.startsWith('/')) {
        targetPath = path.join(ROOT, link);
    } else {
        targetPath = path.join(path.dirname(filePath), link);
    }
    targetPath = targetPath.split('#')[0].split('?')[0];

    if (!fs.existsSync(targetPath)) {
        console.error(`DOCS_CHECK_LINKS_FAIL: Broken link in ${relPath}: ${link} -> ${targetPath} not found.`);
        errors++;
    }
}

function verifyPath(pathStr, relPath) {
    const targetPath = path.join(ROOT, pathStr);
    if (!fs.existsSync(targetPath)) {
        console.error(`DOCS_CHECK_LINKS_FAIL: Broken path reference in ${relPath}: ${pathStr} -> ${targetPath} not found.`);
        errors++;
    }
}

console.log('Scanning for broken local links and path references...');
walk(ROOT);

if (errors > 0) {
    console.error(`FAILED: Found ${errors} broken links/paths.`);
    process.exit(1);
} else {
    console.log('SUCCESS: No broken local links found.');
}
