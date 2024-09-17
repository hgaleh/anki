
const { Observable } = require('rxjs');
const { spawn } = require('child_process');

exports.splitAudio = function(inputFile, startTime, endTime, outputFile, isConvert) {
    const duration = endTime - startTime;

    return new Observable((subscriber) => {
        const cmdFfmpeg = isConvert ? spawn('ffmpeg', [
            '-i',
            inputFile,
            '-ss',
            `${startTime}`,
            '-t',
            `${duration}`,
            '-vn',
            '-ac',
            '2',
            '-c:a',
            'mp3',
            '-b:a',
            '192k',
            outputFile
        ]): spawn('ffmpeg', [
            '-i',
            inputFile,
            '-ss',
            `${startTime}`,
            '-t',
            `${duration}`,
            '-c',
            'copy',
            outputFile
        ]);
        // '-c:v',
        // 'libx264',
        // '-c:a',
        // 'aac',
        // '-b:a',
        // '128k',
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
