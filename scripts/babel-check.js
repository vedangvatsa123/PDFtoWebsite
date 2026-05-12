const babel = require('@babel/core');
const fs = require('fs');

const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'page.tsx'
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.error(e.message);
}
