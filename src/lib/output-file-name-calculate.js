const fs = require('fs');
const path = require('path');
const os = require('os');

exports.outputFileNameCalculate = async function(fileCount, shouldConvert) {
    const prefix = await getPrefix();
    const suffix = shouldConvert ? 'mp3' : 'mp4';
    const fileNameLen = (''+fileCount).length;

    function getFileName(index) {
        return `${padNumber(index + 1, fileNameLen)}.${suffix}`
    }

    return {
        prefix,
        getFileName,
        getPrefixedFileName(index) {
            return path.join(prefix, getFileName(index));
        }
    }
}

function getPrefix() {
    return new Promise((res, rej) => {
        const resOutput = path.join(os.tmpdir(), Math.random().toString());
        fs.mkdirSync(resOutput);
        res(resOutput);
    });
}

function padNumber(number, length) {
    return number.toString().padStart(length, '0');
}
