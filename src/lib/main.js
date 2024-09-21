const path = require('path');

const { getSubtitleBlocks } = require('./get-subtitle-blocks');
const { splitAudio } = require('./split-audio');
const cliProgress = require('cli-progress');
const { from, mergeMap } = require('rxjs');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const { createAnki } = require('./create-anki');
const { getSplitTimes } = require('./get-split-times');
const { extractTextFromSubtitle } = require('./extract-text-from-subtitle');
const { outputFileNameCalculate } = require('./output-file-name-calculate');
const { reduceTime } = require('./reduce-time');

exports.main = async function ({
    inputFile,
    srtFileList,
    convert,
    concurrent,
    deck
}) {
    const deckName = deck ? deck : path.basename(inputFile).split('.').shift();
    const sanitisedDeckName = fullSanitize(deckName);
    const prefixedInputFile = path.resolve(inputFile);
    const prefixedSrtList = srtFileList.map(srtFile => path.resolve(srtFile));
    console.log('Analysing the video file...');
    const srtBlockList = [];
    for (const subtitlePath of prefixedSrtList) {
        srtBlockList.push(await getSubtitleBlocks(subtitlePath));
    }

    const timesAndTexts = srtBlockList.reduce((prev, curr) => {
        return extractTextFromSubtitle(prev, curr);
    }, await getSplitTimes(prefixedInputFile));

    const reducedTimeAndTextx = reduceTime(timesAndTexts);

    const { prefix, getFileName, getPrefixedFileName } = await outputFileNameCalculate(reducedTimeAndTextx.length, convert);

    console.log("Creating splitted files...");
    console.log(`Temporary directory: ${prefix}`);

    console.log();
    bar1.start(reducedTimeAndTextx.length, 0);

    const jobAndCards = reducedTimeAndTextx.map((time, indx) => {
        const splitFileName = getFileName(indx);
        const prefixedSplitFileName = getPrefixedFileName(indx);

        return {
            job: splitAudio(prefixedInputFile, time.start, time.end, prefixedSplitFileName, convert),
            card: { text: time.text, media: prefixedSplitFileName, fileName: splitFileName }
        }
    });

    const jobs = jobAndCards.map(jobAndCard => jobAndCard.job);
    const cardData = jobAndCards.map(jobAndCard => jobAndCard.card);

    const progressMap = new Map();

    from(jobs).pipe(
        mergeMap(obs => obs, concurrent)
    ).subscribe({
        next: (fileDone) => {
            progressMap.set(fileDone, 1);
            const newProgress = Array.from(progressMap.values()).reduce((prev, cur) => {
                return prev + cur;
            }, 0);

            bar1.update(newProgress);
        },
        error: e => {
            console.error(e);
        },
        complete: () => {
            bar1.stop();
            console.log();
            createAnki(sanitisedDeckName, cardData).then(() => {
                console.log(`${sanitisedDeckName} created!`);
            }).catch(e => {
                console.error("Error in creation of anki deck.");
                console.error(e);
            })
        }
    });
}

function fullSanitize(filename) {
    // Define forbidden characters for both Windows and Linux
    const forbiddenChars = /[\\\/:*?"<>|]/g;

    // Replace forbidden characters with an empty string
    const sanitized = filename.replace(forbiddenChars, '');

    // List of reserved filenames in Windows (like CON, PRN, etc.)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

    // Handle reserved names by appending an underscore to avoid conflict
    if (reservedNames.test(sanitized)) {
        return sanitized + '_';
    }

    return sanitized;
}
