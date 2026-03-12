import * as fs from 'fs';
import * as path from 'path';

// Find SomniaEventHandler in node_modules
const possiblePaths = [
  'node_modules/@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol',
  'node_modules/@somnia-chain/reactivity-contracts/SomniaEventHandler.sol',
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    console.log('Found at:', p);
    console.log(fs.readFileSync(p, 'utf8'));
    process.exit(0);
  }
}

// Search more broadly
function findFile(dir: string, filename: string): string[] {
  const results: string[] = [];
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (file === filename) results.push(fullPath);
      else if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules'.repeat(2)) {
        results.push(...findFile(fullPath, filename));
      }
    }
  } catch {}
  return results;
}

const found = findFile('node_modules/@somnia-chain', 'SomniaEventHandler.sol');
if (found.length > 0) {
  console.log('Found:', found[0]);
  console.log(fs.readFileSync(found[0], 'utf8'));
} else {
  console.log('Not found — listing @somnia-chain packages:');
  const dir = 'node_modules/@somnia-chain';
  if (fs.existsSync(dir)) {
    console.log(fs.readdirSync(dir));
    // List all .sol files
    function listSol(d: string): void {
      fs.readdirSync(d).forEach(f => {
        const fp = path.join(d, f);
        if (f.endsWith('.sol')) console.log(fp);
        else if (fs.statSync(fp).isDirectory()) listSol(fp);
      });
    }
    listSol(dir);
  }
}