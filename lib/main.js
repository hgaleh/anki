const path = require('path');

const { getSubtitleBlocks } = require('./get-subtitle-blocks');
const { splitAudio } = require('./split-audio');
const { padNumber } = require('./pad-number');
const cliProgress = require('cli-progress');
const { from, mergeMap } = require('rxjs');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const { createAnki } = require('./create-anki');
const { getSplitTimes } = require('./get-split-times');
const { extractTextFromSubtitle } = require('./extract-text-from-subtitle');
const { getTmpFolder } = require('./get-tmp-folder');

exports.main = async function({
        inputFile,
        srtFileList,
        currentDir,
        convert,
        concurrent,
        deck
    }) {
        const deckName = deck || inputFile.split('.')[0];
        const resInputFile = path.resolve(currentDir, inputFile);
        const resSrtList = srtFileList ? srtFileList.map(srtFile => path.resolve(currentDir, srtFile)) : [];
        console.log('Analysing the video file...');
        const srtBlockList = [];
        for (const subtitlePath of resSrtList) {
            srtBlockList.push(await getSubtitleBlocks(subtitlePath));
        }

        const timesAndTexts = srtBlockList.reduce((prev, curr) => {
            return extractTextFromSubtitle(prev, curr);
        }, await getSplitTimes(resInputFile));
        const fileNameLen = (''+timesAndTexts.length).length;
        const suffix = convert ? 'mp3' : 'mp4';

        console.log("Creating splitted files...");
        const resOutput = await getTmpFolder();
        console.log(`Temporary directory: ${resOutput}`);
        
        console.log();
        bar1.start(timesAndTexts.length, 0);

        const jobAndCards = timesAndTexts.map((time, indx) => {            
            const outputFileName = `${resOutput}/${padNumber(indx + 1, fileNameLen)}.${suffix}`;

            return {
                job: splitAudio(resInputFile, time.start, time.end, outputFileName, convert),
                card: { text: time.text, media: outputFileName, fileName: `${padNumber(indx + 1, fileNameLen)}.${suffix}` }
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
                const randomNumber = Math.random();
                createAnki(deckName, cardData, `${deckName}-${randomNumber}`).then(() => {
                    console.log(`${deckName} created!`);
                });
            }
        });
}
