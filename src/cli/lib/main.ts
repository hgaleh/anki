import path from 'path';

import { createAnki } from './create-anki';
import { getSubtitleAndTimes } from './get-subtitle-and-times';
import { startServer } from './start-server';


export async function main(
    inputFile: string,
    srtFileList: string[],
    concurrent: number,
    deck: string,
    silence: number,
    silenceDuration: number,
    isPlay: boolean
) {
    const prefixedInputFile = path.resolve(inputFile);

    console.log('Analysing the video file...');
    const reducedTimeAndText = await getSubtitleAndTimes(srtFileList, prefixedInputFile, silence, silenceDuration);

    if (isPlay) {
        startServer(reducedTimeAndText, prefixedInputFile);
    } else {
        await createAnki(deck, inputFile, reducedTimeAndText, concurrent);
    }
}
