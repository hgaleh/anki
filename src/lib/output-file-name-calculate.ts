import fs from 'fs';
import path from 'path';
import os from 'os';

export async function outputFileNameCalculate(fileCount: number) {
    const prefix = getPrefix();
    const fileNameLen = ('' + fileCount).length;

    function getFileName(index: number) {
        return `${padNumber(index + 1, fileNameLen)}.mp4`
    }

    return {
        prefix: prefix,
        getFileName,
        getPrefixedFileName(index: number) {
            return path.join(prefix, getFileName(index));
        }
    }
}

export function getPrefix(): string {
    const resOutput = path.join(os.tmpdir(), Math.random().toString().split('.')[1]);
    fs.mkdirSync(resOutput);
    return resOutput;
}

function padNumber(number: number, length: number): string {
    return number.toString().padStart(length, '0');
}
