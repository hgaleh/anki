
import { Observable } from 'rxjs';
import { spawn } from 'child_process';

export function splitAudio(inputFile: string, startTime: number, endTime: number, outputFile: string) {
    const duration = endTime - startTime;
    if (duration < 0) {
        throw 'duration can not be negative';
    }

    return new Observable<string>((subscriber) => {
        const args = [
            '-i',
            inputFile,
            '-ss',
            `${startTime}`,
            '-t',
            `${duration}`,
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            outputFile
        ];

        const cmdFfmpeg = spawn('ffmpeg', args);

        cmdFfmpeg.on('close', (code) => {
            if (code === 0) {
                subscriber.next(outputFile);
                subscriber.complete();
            } else {
                subscriber.error(`ffmpeg exited with code ${code} \n command: ffmpeg ${args.join(' ')}`);
            }
        });
    });
}
