import path from 'path';
import fs from 'fs';
import codeMap from './codeMap.js';

const diagram = codeMap.generateCodeMap(path.join(path.dirname(new URL(import.meta.url).pathname), '../../'));
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../../../code-map.mmd'), diagram, 'utf8');
console.log('Mermaid code map generated at code-map.mmd'); 