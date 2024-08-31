exports.timeToSeconds = function(time) {
    const parts = time.split(':');
    const secondsParts = parts[2].split(',');
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}