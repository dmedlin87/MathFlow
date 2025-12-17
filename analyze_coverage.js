

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coveragePath = path.resolve('coverage/coverage-final.json');
if (!fs.existsSync(coveragePath)) {
    console.error('No coverage file found at', coveragePath);
    process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const results = [];

Object.keys(coverage).forEach(filePath => {
    const fileCov = coverage[filePath];
    const branchMap = fileCov.b;
    const branchCounts = Object.values(branchMap).reduce((acc, branches) => {
        acc.total += branches.length;
        acc.covered += branches.filter(b => b > 0).length;
        return acc;
    }, { total: 0, covered: 0 });

    const statementMap = fileCov.s;
    const statementCounts = Object.values(statementMap).reduce((acc, count) => {
        acc.total++;
        if (count > 0) acc.covered++;
        return acc;
    }, { total: 0, covered: 0 });

    const relativePath = path.relative(process.cwd(), filePath);
    
    // Ignore if no branches (can be 100% or 0% depending on perspective, but we want expansion)
    // If total branches is 0, we can treat it as 100% if statements are covered, or ignore.
    // Let's include everything but sort carefully.
    
    const branchPct = branchCounts.total === 0 ? 100 : (branchCounts.covered / branchCounts.total) * 100;
    const stmtPct = statementCounts.total === 0 ? 100 : (statementCounts.covered / statementCounts.total) * 100;

    results.push({
        file: relativePath,
        branchPct,
        stmtPct,
        branches: branchCounts,
        statements: statementCounts
    });
});

// Sort by Branch % Ascending, then by Total Branches Descending (prioritize complex files)
results.sort((a, b) => {
    if (a.branchPct !== b.branchPct) return a.branchPct - b.branchPct;
    return b.branches.total - a.branches.total;
});

console.log('File | Branch % | Stmt % | Branches (Cov/Tot)');
console.log('---|---|---|---');
results.slice(0, 20).forEach(r => {
    console.log(`${r.file} | ${r.branchPct.toFixed(1)}% | ${r.stmtPct.toFixed(1)}% | ${r.branches.covered}/${r.branches.total}`);
});

