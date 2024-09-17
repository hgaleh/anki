const fs = require('fs');
const path = require('path');
const os = require('os');

exports.getTmpFolder = function() {
    return new Promise((res, rej) => {
        const resOutput = path.join(os.tmpdir(), Math.random().toString());
        fs.mkdirSync(resOutput);
        res(resOutput);
    });
}