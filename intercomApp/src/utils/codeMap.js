const fs = require('fs');
const path = require('path');

// Recursively find all .js and .html files in a directory
function findFiles(dir, exts = ['.js', '.html'], fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findFiles(filePath, exts, fileList);
    } else if (exts.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Parse JS/HTML files for high-level structure (modules, functions, endpoints)
function parseFileStructure(filePath) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let nodes = [];
  if (ext === '.js') {
    // Find exported functions and Express endpoints
    const exportMatches = [...content.matchAll(/exports?\.(\w+)\s*=|module\.exports\s*=\s*{([^}]*)}/g)];
    const endpointMatches = [...content.matchAll(/app\.(get|post|put|delete)\(['"](.*?)['"]/g)];
    exportMatches.forEach(m => {
      if (m[1]) nodes.push(`function ${m[1]}()`);
      if (m[2]) m[2].split(',').map(s => s.trim()).forEach(fn => nodes.push(`function ${fn.replace(/:.*$/, '')}()`));
    });
    endpointMatches.forEach(m => {
      nodes.push(`endpoint ${m[1].toUpperCase()} ${m[2]}`);
    });
  } else if (ext === '.html') {
    // Just note the HTML file
    nodes.push(`html ${path.basename(filePath)}`);
  }
  return nodes;
}

// Generate Mermaid diagram from code structure
function generateCodeMap(rootDir = path.join(__dirname, '../')) {
  const files = findFiles(rootDir);
  let diagram = 'graph TD\n';
  files.forEach(file => {
    const rel = path.relative(rootDir, file);
    const nodes = parseFileStructure(file);
    if (nodes.length) {
      diagram += `  "${rel}":::file\n`;
      nodes.forEach(n => {
        diagram += `  "${rel}"-->|"${n}"|"${n}"\n`;
      });
    }
  });
  diagram += 'classDef file fill:#f9f,stroke:#333,stroke-width:1px;\n';
  return diagram;
}

module.exports = { generateCodeMap }; 