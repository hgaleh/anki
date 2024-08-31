const fs = require('fs');

exports.getTimes = function(srtFileName) {
    return import('srt-parser-2').then(m => {
        const SrtParser = m.default;
    
        const parser = new SrtParser();
    
        return new Promise((res, rej) => {
            fs.readFile(srtFileName, 'utf8', (err, data) => {
                if (err) {
                    rej('Error reading file:' + err);
                }
                const items = parser.fromSrt(data);
    
                res(items);
            });
        });
    });    
}