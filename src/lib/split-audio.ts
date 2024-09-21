
import { Observable } from 'rxjs';
import { spawn } from 'child_process';

export function splitAudio(inputFile: string, startTime: number, endTime: number, outputFile: string) {
    const duration = endTime - startTime;

    return new Observable<string>((subscriber) => {
        const cmdFfmpeg = spawn('ffmpeg', [
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
        ]);

        cmdFfmpeg.on('close', (code) => {
            if (code === 0) {
                subscriber.next(outputFile);
                subscriber.complete();
            } else {
                subscriber.error(`ffmpeg exited with code ${code}`);
            }
        });
    });
}
