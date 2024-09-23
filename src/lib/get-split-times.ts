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

    const modifiedSilences = silences.map(({start, end}) => {
        return {
            midPoint: (start + end) / 2,
            start,
            end
        }
    });

    const nonSilentPoints: SubtitleBlock[] = [];

    /** 
     * start of i-th silence
     * mid     
     * end
     * 
     *        the real voice is here
     * 
     * start of i+1-th silence
     * mid
     * end
    */
    for (let i = 0; i < modifiedSilences.length - 1; i++) {
        nonSilentPoints.push({
            startMargin: modifiedSilences[i].midPoint,
            start: modifiedSilences[i].end,
            end: modifiedSilences[i + 1].start,
            endMargin: modifiedSilences[i + 1].midPoint,
            text: []
        });
    }

    // in case the film does not start with silence
    if(modifiedSilences[0].start > 0) {
        nonSilentPoints.unshift({
            startMargin: 0,
            start: 0,
            end: modifiedSilences[0].start,
            endMargin: modifiedSilences[0].midPoint,
            text: []
        });
    }

    // in case the film does not end with silence
    if (modifiedSilences[modifiedSilences.length - 1].end < duration) {
        nonSilentPoints.push({
            startMargin: modifiedSilences[modifiedSilences.length - 1].midPoint,
            start: modifiedSilences[modifiedSilences.length - 1].end,
            end: duration,
            endMargin: duration,
            text: []
        });
    }

    return nonSilentPoints;
}
