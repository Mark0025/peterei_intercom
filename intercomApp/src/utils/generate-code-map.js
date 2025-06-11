const path = require('path');
const fs = require('fs');
const { generateCodeMap } = require('./codeMap');

const diagram = generateCodeMap(path.join(__dirname, '../../'));
fs.writeFileSync(path.join(__dirname, '../../../code-map.mmd'), diagram, 'utf8');
console.log('Mermaid code map generated at code-map.mmd'); 