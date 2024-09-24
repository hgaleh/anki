import path from 'path';

import { createAnki } from './create-anki';
import { getSubtitleAndTimes } from './get-subtitle-and-times';
import { play } from './play';


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
        await play(reducedTimeAndText, prefixedInputFile);
        process.exit();
    } else {
        await createAnki(deck, inputFile, reducedTimeAndText, concurrent);
    }
}

