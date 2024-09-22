import { spawn } from 'child_process';
import { timeToSeconds } from './time-to-seconds';
import { SubtitleBlock } from './type/subtitle-block';

export function getSplitTimes(inputFile: string, silence: number) {
    return new Promise<SubtitleBlock[]>((resolve, reject) => {
        const silentPeriods: Partial<SubtitleBlock>[] = [];
        let durationMatch: any;

        const ffmpeg = spawn('ffmpeg', [
            '-i', inputFile,
            '-af', `silencedetect=noise=-${silence}dB:d=0.5`, // Adjust threshold & duration as needed
            '-f', 'null', '-'
        ]);

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();

            // Match silence_start, silence_end, and silence_duration from ffmpeg output
            const silenceStartRegex = /silence_start: ([0-9.]+)/;
            const silenceEndRegex = /silence_end: ([0-9.]+)/;
            durationMatch = output.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/) || durationMatch;

            output.split('\n').forEach((line: string) => {
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
                resolve(getSplits(silentPeriods, fileDuration));
            } else {
                reject(`ffmpeg exited with code ${code}`);
            }
        });
    });
}


function getSplits(silences: Partial<SubtitleBlock>[], duration: number): SubtitleBlock[] {
    if (!silences || !silences.length) {
        return [];
    }

    const modifiedSilences: SubtitleBlock[] = silences.map(({start, end}) => {
        const midPoint = (start + end) / 2;
        return {
            startMargin: midPoint,
            endMargin: midPoint,
            start,
            end,
            text: []
        }
    });

    const nonSilentPoints: SubtitleBlock[] = [];

    for (let i = 0; i < modifiedSilences.length - 1; i++) {
        nonSilentPoints.push({
            startMargin: modifiedSilences[i].endMargin,
            start: modifiedSilences[i].end,
            end: modifiedSilences[i + 1].start,
            endMargin: modifiedSilences[i + 1].startMargin,
            text: []
        });
    }

    if(modifiedSilences[0].start > 0) {
        // buildBlock(0, modifiedSilences[0].start)
        nonSilentPoints.unshift({
            startMargin: 0,
            start: 0,
            end: modifiedSilences[0].start,
            endMargin: modifiedSilences[0].startMargin,
            text: []
        });
    }

    if (modifiedSilences[modifiedSilences.length - 1].end < duration) {
        // buildBlock(modifiedSilences[modifiedSilences.length - 1].end, duration)
        nonSilentPoints.push({
            startMargin: modifiedSilences[modifiedSilences.length - 1].endMargin,
            start: modifiedSilences[modifiedSilences.length - 1].end,
            end: duration,
            endMargin: duration,
            text: []
        });
    }

    return nonSilentPoints;
}
