import path from 'path';

import { getSubtitleBlocks } from './get-subtitle-blocks';
import { splitAudio } from './split-audio';
import ProgressBar from 'progress';
import { from, mergeMap } from 'rxjs';
import { createAnki } from './create-anki';
import { getSplitTimes } from './get-split-times';
import { extractTextFromSubtitle } from './extract-text-from-subtitle';
import { outputFileNameCalculate } from './output-file-name-calculate';
import { reduceTime } from './reduce-time';
import { Subtitle } from './type/subtitle';
import { SubtitleBlock } from './type/subtitle-block';
import { CardMeta } from './type/card-meta';

export async function main({
    inputFile,
    srtFileList,
    concurrent,
    deck
}: {
    inputFile: string,
    srtFileList: string[],
    concurrent: number,
    deck: string
}) {
    const deckName = deck ? deck : path.basename(inputFile).split('.').shift();
    const sanitisedDeckName = fullSanitize(deckName);
    const prefixedInputFile = path.resolve(inputFile);
    const prefixedSrtList = srtFileList.map(srtFile => path.resolve(srtFile));
    console.log('Analysing the video file...');
    const subtitleList: Subtitle[][] = [];
    for (const subtitlePath of prefixedSrtList) {
        subtitleList.push(await getSubtitleBlocks(subtitlePath));
    }

    const timesAndTexts: SubtitleBlock[] = subtitleList.reduce((prev, curr) => {
        return extractTextFromSubtitle(prev, curr);
    }, await getSplitTimes(prefixedInputFile));

    const reducedTimeAndTextx = srtFileList.length > 0 ? reduceTime(timesAndTexts) : timesAndTexts;

    const { prefix, getFileName, getPrefixedFileName } = await outputFileNameCalculate(reducedTimeAndTextx.length);

    console.log("Creating splitted files...");
    console.log(`Temporary directory: ${prefix}`);

    console.log();
    const green = '\x1b[32m';
    const reset = '\x1b[0m';
    const bar1 = new ProgressBar(`${green}Splitting progress (:bar) :percent${reset}`, {
        complete: '\u2588',
        incomplete: '\u2591',
        clear: true,
        total: reducedTimeAndTextx.length
    });
    
    const jobAndCards = reducedTimeAndTextx.map((time, indx) => {
        const splitFileName = getFileName(indx);
        const prefixedSplitFileName = getPrefixedFileName(indx);

        return {
            job: splitAudio(prefixedInputFile, time.start, time.end, prefixedSplitFileName),
            card: { text: time.text, media: prefixedSplitFileName, fileName: splitFileName }
        }
    });

    const jobs = jobAndCards.map(jobAndCard => jobAndCard.job);
    const cardData: CardMeta[] = jobAndCards.map(jobAndCard => jobAndCard.card);

    const progressMap = new Map<string, number>();

    from(jobs).pipe(
        mergeMap(obs => obs, concurrent)
    ).subscribe({
        next: (fileDone) => {
            progressMap.set(fileDone, 1);
            const newProgress = Array.from(progressMap.values()).reduce((prev, cur) => {
                return prev + cur;
            }, 0);

            bar1.update(newProgress / reducedTimeAndTextx.length);
        },
        error: e => {
            console.error(e);
        },
        complete: () => {
            bar1.terminate();
            console.log();
            createAnki(sanitisedDeckName, cardData).then(() => {
                console.log(`${green}${sanitisedDeckName} created!${reset}`);
            }).catch(e => {
                console.error("Error in creation of anki deck.");
                console.error(e);
            })
        }
    });
}

function fullSanitize(filename: string) {
    const forbiddenChars = /[\\\/:*?"<>|]/g;
    const sanitized = filename.replace(forbiddenChars, '');
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

    if (reservedNames.test(sanitized)) {
        return sanitized + '_';
    }

    return sanitized;
}
