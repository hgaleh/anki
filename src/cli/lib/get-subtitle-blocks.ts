import fs from 'fs';
import { Subtitle } from './type/subtitle';

export function getSubtitleBlocks(srtFileName: string): Promise<Subtitle[]> {
    return import('srt-parser-2').then(m => {
        const SrtParser = m.default;

        const parser = new SrtParser();

        return new Promise<Subtitle[]>((res, rej) => {
            fs.readFile(srtFileName, 'utf8', (err, data) => {
                if (err) {
                    rej('Error reading file:' + err);
                    return;
                }
                const items = parser.fromSrt(data);

                res(items);
                return;
            });
        });
    });
}
