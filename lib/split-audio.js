const ffmpeg = require('fluent-ffmpeg');
const { timeToSeconds } = require('./time-to-seconds');
const { Observable } = require('rxjs');

exports.splitAudio = function(inputFile, startTime, endTime, outputFile, margin) {
    const startSeconds = timeToSeconds(startTime) - margin;
    const endSeconds = timeToSeconds(endTime) + margin;
    const duration = endSeconds - startSeconds;

    return new Observable((subscriber) => {
        subscriber.next(createProgress(outputFile, 0));

        ffmpeg(inputFile)
            .setStartTime(startSeconds)
            .setDuration(duration)
            .output(outputFile)
            .on('end', function() {
                subscriber.next(createProgress(outputFile, 1));
                subscriber.complete();
            })
            .on('progress', ({ percent }) => {
                if (!percent || Number.isNaN(percent)) {
                    return;
                }

                subscriber.next(createProgress(outputFile, percent));
            })
            .on('error', function(err) {
                subscriber.error();
            })
            .run();
    });
}

function createProgress(file, progress) {
    return {
        file,
        progress
    };
}