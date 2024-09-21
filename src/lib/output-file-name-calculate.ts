import fs from 'fs';
import path from 'path';
import os from 'os';

export async function outputFileNameCalculate(fileCount: number) {
    const prefix = await getPrefix();
    const suffix = 'mp4';
    const fileNameLen = (''+fileCount).length;

    function getFileName(index: number) {
        return `${padNumber(index + 1, fileNameLen)}.${suffix}`
    }

    return {
        prefix,
        getFileName,
        getPrefixedFileName(index: number) {
            return path.join(prefix, getFileName(index));
        }
    }
}

function getPrefix(): Promise<string> {
    return new Promise<string>((res, rej) => {
        const resOutput = path.join(os.tmpdir(), Math.random().toString().split('.')[1]);
        fs.mkdirSync(resOutput);
        res(resOutput);
    });
}

function padNumber(number: number, length: number): string {
    return number.toString().padStart(length, '0');
}
