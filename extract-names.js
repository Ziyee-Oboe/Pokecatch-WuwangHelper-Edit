const fs = require('fs');
const c = fs.readFileSync('d:/吾王助手/pcg-extension/stab.js', 'utf8');
const line = c.split('\n')[18];
const jsSrc = line.substring(line.indexOf('var D = ') + 8, line.lastIndexOf(';'));
const obj = eval(jsSrc);
console.log('D keys:', Object.keys(obj).length);
console.log('has nm:', !!obj.nm);
if (obj.nm) {
  console.log('nm entries:', Object.keys(obj.nm).length);
  console.log('nm[1]:', obj.nm['1']);
  console.log('nm[25]:', obj.nm['25']);
  console.log('nm[132]:', obj.nm['132']);
  console.log('nm[649]:', obj.nm['649']);
  const out = '// 从 stab.js D.nm 自动提取，v1.49\n' +
    'const PCG_NAMES = ' + JSON.stringify(obj.nm) + ';\n' +
    'if (typeof window !== "undefined") window.PCG_NAMES = PCG_NAMES;\n' +
    'if (typeof module !== "undefined") module.exports = PCG_NAMES;\n';
  fs.writeFileSync('d:/吾王助手/pcg-extension/names.js', out);
  console.log('written names.js, bytes:', out.length);
}
