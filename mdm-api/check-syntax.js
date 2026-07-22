// Use Node.js VM to parse and find syntax error with line number
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('C:/M0056/20-AI/40-Minimax/Portal/mdm-api/test-auth-e2e.cjs', 'utf8');

// Try to find the error by binary search
const lines = code.split('\n');

function checkSyntax(code) {
  try {
    new vm.Script(code, { filename: 'test.cjs' });
    return null;
  } catch (e) {
    return e.message;
  }
}

// Binary search for the problematic line
let lo = 0, hi = lines.length;
while (lo < hi) {
  const mid = Math.floor((lo + hi) / 2);
  const partial = lines.slice(0, mid + 1).join('\n');
  const err = checkSyntax(partial + '\nrun();');
  if (err) {
    hi = mid;
  } else {
    lo = mid + 1;
  }
}

// Now check lines around lo
for (let i = Math.max(0, lo - 3); i < Math.min(lines.length, lo + 3); i++) {
  const partial = lines.slice(0, i + 1).join('\n');
  const err = checkSyntax(partial + '\nrun();');
  console.log(`Line ${i+1}: ${err ? 'ERROR: ' + err : 'OK'} | ${JSON.stringify(lines[i][:80])}`);
}
