const fs = require('fs');
const path = require('path');

// Pasta onde o version.json será salvo
const dir = 'public/';

// Cria a pasta se não existir
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Criada pasta: ${dir}`);
}

// Lista de arquivos monitorados para mudanças
const filesToCheck = ['public/index.html', 'public/image.png', 'public/app.js', 'public/service-worker.js'];

function getLastModifiedTime(files) {
    return Math.max(...files.map(file => {
        if (fs.existsSync(file)) {
            return fs.statSync(file).mtimeMs; // Obtém a data da última modificação
        }
        return 0;
    }));
}

// Obtém o timestamp do último arquivo alterado
const lastModified = getLastModifiedTime(filesToCheck);

// Cria ou atualiza o version.json com o timestamp da última alteração
const versionData = { version: lastModified };
fs.writeFileSync(path.join(dir, 'version.json'), JSON.stringify(versionData, null, 2));

console.log(`📢 Nova versão detectada: ${lastModified}`);
