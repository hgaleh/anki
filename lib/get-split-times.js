const { spawn } = require('child_process');
const { timeToSeconds } = require('./time-to-seconds');
const { assert } = require('console');

exports.getSplitTimes = function (inputFile) {
    return new Promise((resolve, reject) => {
        const silentPeriods = [];
        let durationMatch;

        const ffmpeg = spawn('ffmpeg', [
            '-i', inputFile,
            '-af', 'silencedetect=noise=-20dB:d=0.5', // Adjust threshold & duration as needed
            '-f', 'null', '-'
        ]);

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();

            // Match silence_start, silence_end, and silence_duration from ffmpeg output
            const silenceStartRegex = /silence_start: ([0-9.]+)/;
            const silenceEndRegex = /silence_end: ([0-9.]+)/;
            durationMatch = output.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/) || durationMatch;

            output.split('\n').forEach(line => {
                const silenceStartMatch = silenceStartRegex.exec(line);
                const silenceEndMatch = silenceEndRegex.exec(line);

                if (silenceStartMatch) {
                    silentPeriods.push({ start: parseFloat(silenceStartMatch[1]) });
                }

                if (silenceEndMatch) {
                    const lastPeriod = silentPeriods[silentPeriods.length - 1];
                    if (lastPeriod) {
                        lastPeriod.end = parseFloat(silenceEndMatch[1]);
                    }
                }
            });
        });

        ffmpeg.on('error', (err) => {
            reject(`Error running ffmpeg: ${err.message}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                const fileDuration = timeToSeconds(durationMatch[1]);
                resolve(getSplits(silentPeriods, fileDuration, 0.5));
            } else {
                reject(`ffmpeg exited with code ${code}`);
            }
        });
    });
}


function getSplits(silences, duration, maxSilenceDuration) {
    if (!silences || !silences.length) {
        return [];
    }

    const modifiedSilences = silences.map(({start, end}) => {
        const gap = end - start;

        if (gap > (2 * maxSilenceDuration)) {
            return buildBlock(start + maxSilenceDuration, end - maxSilenceDuration)
        } else {
            return buildBlock((start + end) / 2, (start + end) / 2)
        }
    });

    const nonSilentPoints = [];

    for (let i = 0; i < modifiedSilences.length - 1; i++) {
        nonSilentPoints.push(buildBlock(modifiedSilences[i].end, modifiedSilences[i + 1].start));
    }

    if(modifiedSilences[0].start > 0) {
        nonSilentPoints.unshift(buildBlock(0, modifiedSilences[0].start));
    }

    if (modifiedSilences[modifiedSilences.length - 1].end < duration) {
        nonSilentPoints.push(buildBlock(modifiedSilences[modifiedSilences.length - 1].end, duration));
    }

    return nonSilentPoints;
}

function buildBlock(start, end) {
    if((start === undefined) && (end === undefined)) {
        throw "start and end are required";
    }

    return { start, end, text: [] }
}