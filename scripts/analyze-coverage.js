
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');

if (!fs.existsSync(coveragePath)) {
  console.error('Coverage file not found:', coveragePath);
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

const fileStats = [];

let totalBranches = 0;
let coveredBranches = 0;

for (const [filePath, data] of Object.entries(coverage)) {
  const branches = data.b || {};
  let totalB = 0;
  let coveredB = 0;

  for (const branchKey in branches) {
    const branchCounts = branches[branchKey];
    totalB += branchCounts.length;
    coveredB += branchCounts.filter(c => c > 0).length;
  }

  totalBranches += totalB;
  coveredBranches += coveredB;

  const branchPct = totalB === 0 ? 100 : (coveredB / totalB) * 100;
  
  // Use relative path for readability
  const relativePath = filePath.replace(process.cwd().replace(/\\/g, '/'), '').replace(/^\//, '');

  fileStats.push({
    file: relativePath,
    branchPct: branchPct,
    totalBranches: totalB,
    coveredBranches: coveredB,
    lines: Object.keys(data.statementMap).length
  });
}

// Sort by branch coverage ascending, then by total branches descending (prioritize files with branches)
fileStats.sort((a, b) => {
  if (a.branchPct !== b.branchPct) return a.branchPct - b.branchPct;
  return b.totalBranches - a.totalBranches;
});

const globalBranchPct = totalBranches === 0 ? 100 : (coveredBranches / totalBranches) * 100;

const output = [];
output.push('=== Coverage Summary ===');
output.push(`Global Branch Coverage: ${globalBranchPct.toFixed(2)}% (${coveredBranches}/${totalBranches})`);
output.push('\n=== Top 10 Lowest Branch Coverage (Min 1 Branch) ===');

const topOffenders = fileStats.filter(f => f.totalBranches > 0).slice(0, 10);

topOffenders.forEach(f => {
  output.push(`${f.branchPct.toFixed(2)}% (${f.coveredBranches}/${f.totalBranches}) - ${f.file}`);
});

output.push('\n=== Zero Branch Files (Top 5 by size) ===');
const zeroBranchFiles = fileStats.filter(f => f.totalBranches === 0).sort((a, b) => b.lines - a.lines).slice(0, 5);
zeroBranchFiles.forEach(f => {
  output.push(`N/A (0 branches) - ${f.file} (${f.lines} statements)`);
});

fs.writeFileSync(path.join(process.cwd(), 'coverage-summary.txt'), output.join('\n'));
console.log('Written to coverage-summary.txt');
