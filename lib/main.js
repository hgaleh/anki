const path = require('path');

const { getTimes } = require('./get-times');
const { splitAudio } = require('./split-audio');
const { padNumber } = require('./pad-number');
const { clean } = require('./clean');
const cliProgress = require('cli-progress');
const { from, mergeMap } = require('rxjs');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

exports.main = async function({
        inputFile,
        srtFile,
        outputDir,
        currentDir,
        convert,
        margin,
        concurrent
    }) {
        const resInputFile = path.resolve(currentDir, inputFile);
        const resSrtFile = path.resolve(currentDir, srtFile);
        const times = await getTimes(resSrtFile);
        const fileNameLen = (''+times.length).length;
        const suffix = convert ? 'mp3' : inputFile.split('.')[inputFile.split('.').length - 1];
        await clean(currentDir, outputDir);
        console.log("cleanned the output!");
        console.log("Creating splitted files...");
        console.log();
        const resOutput = path.resolve(currentDir, outputDir);
        bar1.start(times.length, 0);

        const jobs = times.map((time, indx) => {
            return splitAudio(resInputFile, time.startTime, time.endTime, `${resOutput}/${padNumber(indx + 1, fileNameLen)}.${suffix}`, margin);
        });

        const progressMap = new Map();

        from(jobs).pipe(
            mergeMap(obs => obs, concurrent)
        ).subscribe({
            next: (progressObj) => {
                progressMap.set(progressObj.file, progressObj.progress);
                const newProgress = Array.from(progressMap.values()).reduce((prev, cur) => {
                    return prev + cur;
                }, 0);

                bar1.update(Math.round(newProgress * 10) / 10);
            },
            error: e => {
                console.error(e);
            },
            complete: () => {
                bar1.stop();
                console.log();
                console.log("Done");
            }
        });
}
