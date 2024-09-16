const path = require('path');

const { getSubtitleBlocks } = require('./get-subtitle-blocks');
const { splitAudio } = require('./split-audio');
const { padNumber } = require('./pad-number');
const { clean } = require('./clean');
const cliProgress = require('cli-progress');
const { from, mergeMap } = require('rxjs');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const { createAnki } = require('./create-anki');
const { getSplitTimes } = require('./get-split-times');
const { extractTextFromSubtitle } = require('./extract-text-from-subtitle');

exports.main = async function({
        inputFile,
        srtFile,
        outputDir,
        currentDir,
        convert,
        concurrent,
        deck
    }) {
        const deckName = deck || inputFile.split('.')[0];
        const resInputFile = path.resolve(currentDir, inputFile);
        const resSrtFile = path.resolve(currentDir, srtFile);
        const timesAndTexts = extractTextFromSubtitle(await getSplitTimes(resInputFile), await getSubtitleBlocks(resSrtFile));
        const fileNameLen = (''+timesAndTexts.length).length;
        const suffix = convert ? 'mp3' : 'mp4';
        await clean(currentDir, outputDir);
        console.log("cleanned the output!");
        console.log("Creating splitted files...");
        console.log();
        const resOutput = path.resolve(currentDir, outputDir);
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
                console.log("Done");
                const randomNumber = Math.random();
                createAnki(deckName, cardData, `${deckName}-${randomNumber}`).then(() => {
                    console.log(`${deckName} created!`);
                });
            }
        });
}
