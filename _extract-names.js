const fs = require('fs');
const jsSrc = fs.readFileSync('d:/吾王助手/_temp-d.js', 'utf8');
const D = eval('(' + jsSrc + ')');
console.log('D.nm entries:', D.nm ? Object.keys(D.nm).length : 'no nm');
if (D.nm) {
  console.log('nm[1]:', D.nm['1']);
  console.log('nm[25]:', D.nm['25']);
  console.log('nm[132]:', D.nm['132']);
  const out = '// Auto-extracted from stab.js D.nm (v1.49, 2026-11-22)\n' +
    '// 中文宝可梦名，index 与 game pension.mons[].mon.id 对齐\n' +
    'var PCG_NAMES = ' + JSON.stringify(D.nm) + ';\n';
  fs.writeFileSync('d:/吾王助手/pcg-extension/names.js', out);
  console.log('written. bytes:', out.length);
}
