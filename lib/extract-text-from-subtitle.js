const { timeToSeconds } = require("./time-to-seconds");

exports.extractTextFromSubtitle = function(splitTimes, subtitleBlocks) {
    const subtitleWithConvertedTimes = subtitleBlocks.map(subBlock => {
        return {
            start: timeToSeconds(subBlock.startTime),
            end: timeToSeconds(subBlock.endTime),
            text: subBlock.text
        };
    })
    return splitTimes.map(({ start, end, text }) => {
        const includedSubs = subtitleWithConvertedTimes.filter(sub => Math.max(start, sub.start) <= Math.min(end, sub.end));
        const currentText = includedSubs.reduce((prev, cur) => {
            return prev + ' ' + cur.text;
        }, '');
        return {
            start,
            end,
            text: text ? [...text, currentText] : [currentText]
        }
    });
}
