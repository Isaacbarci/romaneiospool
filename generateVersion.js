const fs = require('fs');
const path = require('path');

// Definir corretamente o caminho da pasta 'public'
const dir = path.join(__dirname, 'public');

// Criar a pasta 'public' se não existir
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Criada pasta: ${dir}`);
}

// Lista de arquivos monitorados para mudanças
const filesToCheck = [
    path.join(dir, 'index.html'),
    path.join(dir, 'image.png'),
    path.join(dir, 'app.js'),
    path.join(dir, 'service-worker.js')
];

// Obtém o timestamp da última modificação dos arquivos monitorados
function getLastModifiedTime(files) {
    return Math.max(...files.map(file => {
        if (fs.existsSync(file)) {
            return fs.statSync(file).mtimeMs;
        }
        return 0;
    }));
}

const lastModified = getLastModifiedTime(filesToCheck);

// Criar ou atualizar `version.json` corretamente dentro da pasta 'public'
const versionData = { version: lastModified };
fs.writeFileSync(path.join(dir, 'version.json'), JSON.stringify(versionData, null, 2));

console.log(`📢 Nova versão detectada: ${lastModified}`);
