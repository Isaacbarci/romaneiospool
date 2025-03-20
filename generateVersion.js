const fs = require('fs');
const path = require('path');

// Lista de arquivos que queremos monitorar
const filesToCheck = ['public/index.html', 'public/image.png', 'public/app.js', 'public/service-worker.js'];

function getLastModifiedTime(files) {
    return Math.max(...files.map(file => {
        if (fs.existsSync(file)) {
            return fs.statSync(file).mtimeMs; // Obtém o timestamp da última modificação
        }
        return 0;
    }));
}

// Obtém o timestamp do último arquivo alterado
const lastModified = getLastModifiedTime(filesToCheck);

// Cria ou atualiza o version.json com o timestamp da última alteração
const versionData = { version: lastModified };
fs.writeFileSync('public/version.json', JSON.stringify(versionData, null, 2));

console.log(`📢 Nova versão detectada: ${lastModified}`);
