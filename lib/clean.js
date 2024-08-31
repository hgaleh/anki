const fs = require('fs');
const path = require('path');

exports.clean = function(currentDirectory, buildFolderName) {
    return new Promise((res, rej) => {
        const folderPath = path.join(currentDirectory, buildFolderName);

        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }

        fs.mkdirSync(folderPath);
        res();
    });
}