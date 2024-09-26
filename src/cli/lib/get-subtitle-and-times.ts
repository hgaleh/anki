import path from 'path';

import { getSubtitleBlocks } from './get-subtitle-blocks';
import { getSplitTimes } from './get-split-times';
import { extractTextFromSubtitle } from './extract-text-from-subtitle';
import { reduceTime } from './reduce-time';
import { Subtitle } from './type/subtitle';
import { SubtitleBlock } from '../../share/subtitle-block';

export async function getSubtitleAndTimes(srtFileList: string[], prefixedInputFile: string, silence: number, silenceDuration: number):  Promise<SubtitleBlock[]> {
    const prefixedSrtList = srtFileList.map(srtFile => path.resolve(srtFile));
    const subtitleList: Subtitle[][] = [];
    for (const subtitlePath of prefixedSrtList) {
        subtitleList.push(await getSubtitleBlocks(subtitlePath));
    }

    const timesAndTexts: SubtitleBlock[] = subtitleList.reduce((prev, curr) => {
        return extractTextFromSubtitle(prev, curr);
    }, await getSplitTimes(prefixedInputFile, silence, silenceDuration));

    return srtFileList.length > 0 ? reduceTime(timesAndTexts) : timesAndTexts;
}