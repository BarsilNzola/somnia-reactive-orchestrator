import * as fs from 'fs';
import * as path from 'path';

function listSol(d: string): void {
  try {
    fs.readdirSync(d).forEach(f => {
      const fp = path.join(d, f);
      if (f.endsWith('.sol')) {
        console.log('\n━━━', fp, '━━━');
        console.log(fs.readFileSync(fp, 'utf8'));
      }
      else if (fs.statSync(fp).isDirectory()) listSol(fp);
    });
  } catch {}
}

listSol('node_modules/@somnia-chain/reactivity-contracts/contracts/interfaces');