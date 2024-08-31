const ffmpeg = require('fluent-ffmpeg');
const { timeToSeconds } = require('./time-to-seconds');
const { Observable } = require('rxjs');

exports.splitAudio = function(inputFile, startTime, endTime, outputFile, margin) {
    const startSeconds = timeToSeconds(startTime) - margin;
    const endSeconds = timeToSeconds(endTime) + margin;
    const duration = endSeconds - startSeconds;

    return new Observable((subscriber) => {
        subscriber.next(0);

        ffmpeg(inputFile)
            .setStartTime(startSeconds)
            .setDuration(duration)
            .output(outputFile)
            .on('end', function() {
                subscriber.next(1);
                subscriber.complete();
            })
            .on('progress', ({ percent }) => {
                if (!Number.isNaN(percent)) {
                    subscriber.next(percent);
                }
            })
            .on('error', function(err) {
                subscriber.error();
            })
            .run();
    });
}