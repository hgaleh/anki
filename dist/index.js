#!/usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const yargs_1 = __importDefault(__webpack_require__(/*! yargs */ "yargs"));
const helpers_1 = __webpack_require__(/*! yargs/helpers */ "yargs/helpers");
const main_1 = __webpack_require__(/*! ./lib/main */ "./src/lib/main.ts");
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('$0 <input>', 'Create anki decks using a video and its subtitle', (yargs) => {
    yargs
        .positional('input', {
        describe: 'The input file path',
        type: 'string',
    })
        .option('srt', {
        describe: 'The SRT file(s)',
        type: 'array',
        default: []
    })
        .option('convert', {
        alias: 'c',
        type: 'boolean',
        default: false,
        description: 'Converts the input file to mp3 before splitting'
    })
        .options('concurrent', {
        type: 'number',
        default: 10,
        description: 'Maximum concurrent output files to be created'
    }).
        options('deck', {
        alias: 'd',
        type: 'string',
        description: 'Anki deck name, default is the input file name'
    });
}, async ({ input, srt, convert, concurrent, deck }) => {
    await (0, main_1.main)({
        inputFile: input,
        srtFileList: srt,
        convert,
        concurrent,
        deck
    });
})
    .help()
    .argv;


/***/ }),

/***/ "./src/lib/anki-exporter.ts":
/*!**********************************!*\
  !*** ./src/lib/anki-exporter.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnkiExporter = AnkiExporter;
const sha1_1 = __importDefault(__webpack_require__(/*! sha1 */ "sha1"));
const archiver_1 = __importDefault(__webpack_require__(/*! archiver */ "archiver"));
const template_1 = __webpack_require__(/*! ./template */ "./src/lib/template.ts");
const sql_memory_growth_1 = __importDefault(__webpack_require__(/*! sql.js/js/sql-memory-growth */ "sql.js/js/sql-memory-growth"));
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
class Exporter {
    constructor(deckName, { template, sql }) {
        this.db = new sql.Database();
        this.db.run(template);
        const now = Date.now();
        const topDeckId = this._getId('cards', 'did', now);
        const topModelId = this._getId('notes', 'mid', now);
        this.deckName = deckName;
        this.zip = (0, archiver_1.default)('zip', {
            zlib: { level: 9 }
        });
        this.media = [];
        this.topDeckId = topDeckId;
        this.topModelId = topModelId;
        this.separator = '\u001F';
        const decks = this._getInitialRowValue('col', 'decks');
        const deck = getLastItem(decks);
        deck.name = this.deckName;
        deck.id = topDeckId;
        decks[topDeckId + ''] = deck;
        this._update('update col set decks=:decks where id=1', { ':decks': JSON.stringify(decks) });
        const models = this._getInitialRowValue('col', 'models');
        const model = getLastItem(models);
        model.name = this.deckName;
        model.did = this.topDeckId;
        model.id = topModelId;
        models[`${topModelId}`] = model;
        this._update('update col set models=:models where id=1', { ':models': JSON.stringify(models) });
    }
    save(path) {
        return new Promise((res, rej) => {
            const output = fs_1.default.createWriteStream(path);
            this.zip.on('close', function () {
                res();
            });
            // Catch any errors that might occur
            this.zip.on('error', function (err) {
                rej(err);
            });
            const binaryArray = this.db.export();
            const mediaObj = this.media.reduce((prev, curr, idx) => {
                prev[idx] = curr.filename;
                return prev;
            }, {});
            this.zip.append(Buffer.from(binaryArray), { name: 'collection.anki2' });
            this.zip.append(JSON.stringify(mediaObj), { name: 'media' });
            this.media.forEach((item, i) => this.zip.file(item.filePath, { name: `${i}` }));
            this.zip.pipe(output);
            this.zip.finalize();
        });
    }
    addMedia(filename, filePath) {
        this.media.push({ filename, filePath });
    }
    addCard(front, back, { tags } = { tags: undefined }) {
        const { topDeckId, topModelId, separator } = this;
        const now = Date.now();
        const note_guid = this._getNoteGuid(topDeckId, front, back);
        const note_id = this._getNoteId(note_guid, now);
        let strTags = '';
        if (typeof tags === 'string') {
            strTags = tags;
        }
        else if (Array.isArray(tags)) {
            strTags = this._tagsToStr(tags);
        }
        this._update('insert or replace into notes values(:id,:guid,:mid,:mod,:usn,:tags,:flds,:sfld,:csum,:flags,:data)', {
            ':id': note_id, // integer primary key,
            ':guid': note_guid, // text not null,
            ':mid': topModelId, // integer not null,
            ':mod': this._getId('notes', 'mod', now), // integer not null,
            ':usn': -1, // integer not null,
            ':tags': strTags, // text not null,
            ':flds': front + separator + back, // text not null,
            ':sfld': front, // integer not null,
            ':csum': this._checksum(front + separator + back), //integer not null,
            ':flags': 0, // integer not null,
            ':data': '' // text not null,
        });
        return this._update('insert or replace into cards values(:id,:nid,:did,:ord,:mod,:usn,:type,:queue,:due,:ivl,:factor,:reps,:lapses,:left,:odue,:odid,:flags,:data)', {
            ':id': this._getCardId(note_id, now), // integer primary key,
            ':nid': note_id, // integer not null,
            ':did': topDeckId, // integer not null,
            ':ord': 0, // integer not null,
            ':mod': this._getId('cards', 'mod', now), // integer not null,
            ':usn': -1, // integer not null,
            ':type': 0, // integer not null,
            ':queue': 0, // integer not null,
            ':due': 179, // integer not null,
            ':ivl': 0, // integer not null,
            ':factor': 0, // integer not null,
            ':reps': 0, // integer not null,
            ':lapses': 0, // integer not null,
            ':left': 0, // integer not null,
            ':odue': 0, // integer not null,
            ':odid': 0, // integer not null,
            ':flags': 0, // integer not null,
            ':data': '' // text not null
        });
    }
    _update(query, obj) {
        this.db.prepare(query).getAsObject(obj);
    }
    _getInitialRowValue(table, column = 'id') {
        const query = `select ${column} from ${table}`;
        return this._getFirstVal(query);
    }
    _checksum(str) {
        return parseInt((0, sha1_1.default)(str).substr(0, 8), 16);
    }
    _getFirstVal(query) {
        return JSON.parse(this.db.exec(query)[0].values[0]);
    }
    _tagsToStr(tags = []) {
        return ' ' + tags.map(tag => tag.replace(/ /g, '_')).join(' ') + ' ';
    }
    _getId(table, col, ts) {
        const query = `SELECT ${col} from ${table} WHERE ${col} >= :ts ORDER BY ${col} DESC LIMIT 1`;
        const rowObj = this.db.prepare(query).getAsObject({ ':ts': ts });
        return rowObj[col] ? +rowObj[col] + 1 : ts;
    }
    _getNoteId(guid, ts) {
        const query = `SELECT id from notes WHERE guid = :guid ORDER BY id DESC LIMIT 1`;
        const rowObj = this.db.prepare(query).getAsObject({ ':guid': guid });
        return rowObj.id || this._getId('notes', 'id', ts);
    }
    _getNoteGuid(topDeckId, front, back) {
        return (0, sha1_1.default)(`${topDeckId}${front}${back}`);
    }
    _getCardId(note_id, ts) {
        const query = `SELECT id from cards WHERE nid = :note_id ORDER BY id DESC LIMIT 1`;
        const rowObj = this.db.prepare(query).getAsObject({ ':note_id': note_id });
        return rowObj.id || this._getId('cards', 'id', ts);
    }
}
function getLastItem(obj) {
    const keys = Object.keys(obj);
    const lastKey = keys[keys.length - 1];
    const item = obj[lastKey];
    delete obj[lastKey];
    return item;
}
;
function AnkiExporter(deckName, template) {
    return new Exporter(deckName, {
        template: (0, template_1.createTemplate)(template),
        sql: sql_memory_growth_1.default
    });
}


/***/ }),

/***/ "./src/lib/create-anki.ts":
/*!********************************!*\
  !*** ./src/lib/create-anki.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createAnki = createAnki;
const anki_exporter_1 = __webpack_require__(/*! ./anki-exporter */ "./src/lib/anki-exporter.ts");
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
function createAnki(deckName, cardData) {
    const randomNumber = Math.random();
    const prefix = `${deckName}-${randomNumber}`;
    return new Promise((res, rej) => {
        const apkg = (0, anki_exporter_1.AnkiExporter)(deckName);
        cardData.forEach(card => {
            const mediaAddress = `${prefix}-${card.fileName}`;
            const text = card.text.reduce((prev, cur) => {
                return prev + `<p>${cur}</p>`;
            }, '');
            apkg.addMedia(mediaAddress, card.media);
            apkg.addCard(`[sound:${mediaAddress}]`, `${text}`);
        });
        apkg
            .save(path_1.default.resolve(`${deckName}.apkg`))
            .then(() => {
            res();
        })
            .catch(err => rej(err.stack || err));
    });
}


/***/ }),

/***/ "./src/lib/extract-text-from-subtitle.ts":
/*!***********************************************!*\
  !*** ./src/lib/extract-text-from-subtitle.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractTextFromSubtitle = extractTextFromSubtitle;
const time_to_seconds_1 = __webpack_require__(/*! ./time-to-seconds */ "./src/lib/time-to-seconds.ts");
function extractTextFromSubtitle(splitTimes, subtitleBlocks) {
    const subtitleWithConvertedTimes = subtitleBlocks.map(subBlock => {
        return {
            start: (0, time_to_seconds_1.timeToSeconds)(subBlock.startTime),
            end: (0, time_to_seconds_1.timeToSeconds)(subBlock.endTime),
            text: subBlock.text
        };
    });
    return splitTimes.map(({ start, end, text }) => {
        const includedSubs = subtitleWithConvertedTimes.filter(sub => Math.max(start, sub.start) <= Math.min(end, sub.end));
        const currentText = includedSubs.reduce((prev, cur) => {
            return prev + ' ' + cur.text;
        }, '');
        return {
            start,
            end,
            text: text ? [...text, currentText] : [currentText]
        };
    });
}


/***/ }),

/***/ "./src/lib/get-split-times.ts":
/*!************************************!*\
  !*** ./src/lib/get-split-times.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSplitTimes = getSplitTimes;
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const time_to_seconds_1 = __webpack_require__(/*! ./time-to-seconds */ "./src/lib/time-to-seconds.ts");
function getSplitTimes(inputFile) {
    return new Promise((resolve, reject) => {
        const silentPeriods = [];
        let durationMatch;
        const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
            '-i', inputFile,
            '-af', 'silencedetect=noise=-20dB:d=0.5', // Adjust threshold & duration as needed
            '-f', 'null', '-'
        ]);
        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            // Match silence_start, silence_end, and silence_duration from ffmpeg output
            const silenceStartRegex = /silence_start: ([0-9.]+)/;
            const silenceEndRegex = /silence_end: ([0-9.]+)/;
            durationMatch = output.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/) || durationMatch;
            output.split('\n').forEach((line) => {
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
                const fileDuration = (0, time_to_seconds_1.timeToSeconds)(durationMatch[1]);
                resolve(getSplits(silentPeriods, fileDuration, 0.5));
            }
            else {
                reject(`ffmpeg exited with code ${code}`);
            }
        });
    });
}
function getSplits(silences, duration, maxSilenceDuration) {
    if (!silences || !silences.length) {
        return [];
    }
    const modifiedSilences = silences.map(({ start, end }) => {
        const gap = end - start;
        if (gap > (2 * maxSilenceDuration)) {
            return buildBlock(start + maxSilenceDuration, end - maxSilenceDuration);
        }
        else {
            return buildBlock((start + end) / 2, (start + end) / 2);
        }
    });
    const nonSilentPoints = [];
    for (let i = 0; i < modifiedSilences.length - 1; i++) {
        nonSilentPoints.push(buildBlock(modifiedSilences[i].end, modifiedSilences[i + 1].start));
    }
    if (modifiedSilences[0].start > 0) {
        nonSilentPoints.unshift(buildBlock(0, modifiedSilences[0].start));
    }
    if (modifiedSilences[modifiedSilences.length - 1].end < duration) {
        nonSilentPoints.push(buildBlock(modifiedSilences[modifiedSilences.length - 1].end, duration));
    }
    return nonSilentPoints;
}
function buildBlock(start, end) {
    if ((start === undefined) && (end === undefined)) {
        throw "start and end are required";
    }
    return { start, end, text: [] };
}


/***/ }),

/***/ "./src/lib/get-subtitle-blocks.ts":
/*!****************************************!*\
  !*** ./src/lib/get-subtitle-blocks.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSubtitleBlocks = getSubtitleBlocks;
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
function getSubtitleBlocks(srtFileName) {
    return Promise.resolve(/*! import() */).then(__webpack_require__.t.bind(__webpack_require__, /*! srt-parser-2 */ "srt-parser-2", 23)).then(m => {
        const SrtParser = m.default;
        const parser = new SrtParser();
        return new Promise((res, rej) => {
            fs_1.default.readFile(srtFileName, 'utf8', (err, data) => {
                if (err) {
                    rej('Error reading file:' + err);
                }
                const items = parser.fromSrt(data);
                res(items);
            });
        });
    });
}


/***/ }),

/***/ "./src/lib/main.ts":
/*!*************************!*\
  !*** ./src/lib/main.ts ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = main;
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const get_subtitle_blocks_1 = __webpack_require__(/*! ./get-subtitle-blocks */ "./src/lib/get-subtitle-blocks.ts");
const split_audio_1 = __webpack_require__(/*! ./split-audio */ "./src/lib/split-audio.ts");
const progress_1 = __importDefault(__webpack_require__(/*! progress */ "progress"));
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const create_anki_1 = __webpack_require__(/*! ./create-anki */ "./src/lib/create-anki.ts");
const get_split_times_1 = __webpack_require__(/*! ./get-split-times */ "./src/lib/get-split-times.ts");
const extract_text_from_subtitle_1 = __webpack_require__(/*! ./extract-text-from-subtitle */ "./src/lib/extract-text-from-subtitle.ts");
const output_file_name_calculate_1 = __webpack_require__(/*! ./output-file-name-calculate */ "./src/lib/output-file-name-calculate.ts");
const reduce_time_1 = __webpack_require__(/*! ./reduce-time */ "./src/lib/reduce-time.ts");
async function main({ inputFile, srtFileList, convert, concurrent, deck }) {
    const deckName = deck ? deck : path_1.default.basename(inputFile).split('.').shift();
    const sanitisedDeckName = fullSanitize(deckName);
    const prefixedInputFile = path_1.default.resolve(inputFile);
    const prefixedSrtList = srtFileList.map(srtFile => path_1.default.resolve(srtFile));
    console.log('Analysing the video file...');
    const subtitleList = [];
    for (const subtitlePath of prefixedSrtList) {
        subtitleList.push(await (0, get_subtitle_blocks_1.getSubtitleBlocks)(subtitlePath));
    }
    const timesAndTexts = subtitleList.reduce((prev, curr) => {
        return (0, extract_text_from_subtitle_1.extractTextFromSubtitle)(prev, curr);
    }, await (0, get_split_times_1.getSplitTimes)(prefixedInputFile));
    const reducedTimeAndTextx = (0, reduce_time_1.reduceTime)(timesAndTexts);
    const { prefix, getFileName, getPrefixedFileName } = await (0, output_file_name_calculate_1.outputFileNameCalculate)(reducedTimeAndTextx.length, convert);
    console.log("Creating splitted files...");
    console.log(`Temporary directory: ${prefix}`);
    console.log();
    const green = '\x1b[32m';
    const reset = '\x1b[0m';
    const bar1 = new progress_1.default(`${green}Splitting progress (:bar) :percent${reset}`, {
        complete: '\u2588',
        incomplete: '\u2591',
        clear: true,
        total: reducedTimeAndTextx.length
    });
    const jobAndCards = reducedTimeAndTextx.map((time, indx) => {
        const splitFileName = getFileName(indx);
        const prefixedSplitFileName = getPrefixedFileName(indx);
        return {
            job: (0, split_audio_1.splitAudio)(prefixedInputFile, time.start, time.end, prefixedSplitFileName, convert),
            card: { text: time.text, media: prefixedSplitFileName, fileName: splitFileName }
        };
    });
    const jobs = jobAndCards.map(jobAndCard => jobAndCard.job);
    const cardData = jobAndCards.map(jobAndCard => jobAndCard.card);
    const progressMap = new Map();
    (0, rxjs_1.from)(jobs).pipe((0, rxjs_1.mergeMap)(obs => obs, concurrent)).subscribe({
        next: (fileDone) => {
            progressMap.set(fileDone, 1);
            const newProgress = Array.from(progressMap.values()).reduce((prev, cur) => {
                return prev + cur;
            }, 0);
            bar1.update(newProgress / reducedTimeAndTextx.length);
        },
        error: e => {
            console.error(e);
        },
        complete: () => {
            bar1.terminate();
            console.log();
            (0, create_anki_1.createAnki)(sanitisedDeckName, cardData).then(() => {
                console.log(`${sanitisedDeckName} created!`);
            }).catch(e => {
                console.error("Error in creation of anki deck.");
                console.error(e);
            });
        }
    });
}
function fullSanitize(filename) {
    const forbiddenChars = /[\\\/:*?"<>|]/g;
    const sanitized = filename.replace(forbiddenChars, '');
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(sanitized)) {
        return sanitized + '_';
    }
    return sanitized;
}


/***/ }),

/***/ "./src/lib/output-file-name-calculate.ts":
/*!***********************************************!*\
  !*** ./src/lib/output-file-name-calculate.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.outputFileNameCalculate = outputFileNameCalculate;
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const os_1 = __importDefault(__webpack_require__(/*! os */ "os"));
async function outputFileNameCalculate(fileCount, shouldConvert) {
    const prefix = await getPrefix();
    const suffix = shouldConvert ? 'mp3' : 'mp4';
    const fileNameLen = ('' + fileCount).length;
    function getFileName(index) {
        return `${padNumber(index + 1, fileNameLen)}.${suffix}`;
    }
    return {
        prefix,
        getFileName,
        getPrefixedFileName(index) {
            return path_1.default.join(prefix, getFileName(index));
        }
    };
}
function getPrefix() {
    return new Promise((res, rej) => {
        const resOutput = path_1.default.join(os_1.default.tmpdir(), Math.random().toString());
        fs_1.default.mkdirSync(resOutput);
        res(resOutput);
    });
}
function padNumber(number, length) {
    return number.toString().padStart(length, '0');
}


/***/ }),

/***/ "./src/lib/reduce-time.ts":
/*!********************************!*\
  !*** ./src/lib/reduce-time.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reduceTime = reduceTime;
function reduceTime(timesAndTexts) {
    return timesAndTexts;
}


/***/ }),

/***/ "./src/lib/split-audio.ts":
/*!********************************!*\
  !*** ./src/lib/split-audio.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.splitAudio = splitAudio;
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
function splitAudio(inputFile, startTime, endTime, outputFile, isConvert) {
    const duration = endTime - startTime;
    return new rxjs_1.Observable((subscriber) => {
        const cmdFfmpeg = isConvert ? (0, child_process_1.spawn)('ffmpeg', [
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
        ]) : (0, child_process_1.spawn)('ffmpeg', [
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
            }
            else {
                subscriber.error(`ffmpeg exited with code ${code}`);
            }
        });
    });
}


/***/ }),

/***/ "./src/lib/template.ts":
/*!*****************************!*\
  !*** ./src/lib/template.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


// @ts-nocheck
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createTemplate = createTemplate;
function createTemplate({ questionFormat = '{{Front}}', answerFormat = '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}', css = '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\nbackground-color: white;\n}\n' } = {}) {
    const conf = {
        nextPos: 1,
        estTimes: true,
        activeDecks: [1],
        sortType: 'noteFld',
        timeLim: 0,
        sortBackwards: false,
        addToCur: true,
        curDeck: 1,
        newBury: true,
        newSpread: 0,
        dueCounts: true,
        curModel: '1435645724216',
        collapseTime: 1200
    };
    const models = {
        1388596687391: {
            veArs: [],
            name: 'Basic-f15d2',
            tags: ['Tag'],
            did: 1435588830424,
            usn: -1,
            req: [[0, 'all', [0]]],
            flds: [
                {
                    name: 'Front',
                    media: [],
                    sticky: false,
                    rtl: false,
                    ord: 0,
                    font: 'Arial',
                    size: 20
                },
                {
                    name: 'Back',
                    media: [],
                    sticky: false,
                    rtl: false,
                    ord: 1,
                    font: 'Arial',
                    size: 20
                }
            ],
            sortf: 0,
            latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
            tmpls: [
                {
                    name: 'Card 1',
                    qfmt: questionFormat,
                    did: null,
                    bafmt: '',
                    afmt: answerFormat,
                    ord: 0,
                    bqfmt: ''
                }
            ],
            latexPost: '\\end{document}',
            type: 0,
            id: 1388596687391,
            css,
            mod: 1435645658
        }
    };
    const decks = {
        1: {
            desc: '',
            name: 'Default',
            extendRev: 50,
            usn: 0,
            collapsed: false,
            newToday: [0, 0],
            timeToday: [0, 0],
            dyn: 0,
            extendNew: 10,
            conf: 1,
            revToday: [0, 0],
            lrnToday: [0, 0],
            id: 1,
            mod: 1435645724
        },
        1435588830424: {
            desc: '',
            name: 'Template',
            extendRev: 50,
            usn: -1,
            collapsed: false,
            newToday: [545, 0],
            timeToday: [545, 0],
            dyn: 0,
            extendNew: 10,
            conf: 1,
            revToday: [545, 0],
            lrnToday: [545, 0],
            id: 1435588830424,
            mod: 1435588830
        }
    };
    const dconf = {
        1: {
            name: 'Default',
            replayq: true,
            lapse: {
                leechFails: 8,
                minInt: 1,
                delays: [10],
                leechAction: 0,
                mult: 0
            },
            rev: {
                perDay: 100,
                fuzz: 0.05,
                ivlFct: 1,
                maxIvl: 36500,
                ease4: 1.3,
                bury: true,
                minSpace: 1
            },
            timer: 0,
            maxTaken: 60,
            usn: 0,
            new: {
                perDay: 20,
                delays: [1, 10],
                separate: true,
                ints: [1, 4, 7],
                initialFactor: 2500,
                bury: true,
                order: 1
            },
            mod: 0,
            id: 1,
            autoplay: true
        }
    };
    return `
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      CREATE TABLE col (
          id              integer primary key,
          crt             integer not null,
          mod             integer not null,
          scm             integer not null,
          ver             integer not null,
          dty             integer not null,
          usn             integer not null,
          ls              integer not null,
          conf            text not null,
          models          text not null,
          decks           text not null,
          dconf           text not null,
          tags            text not null
      );
      INSERT INTO "col" VALUES(
        1,
        1388548800,
        1435645724219,
        1435645724215,
        11,
        0,
        0,
        0,
        '${JSON.stringify(conf)}',
        '${JSON.stringify(models)}',
        '${JSON.stringify(decks)}',
        '${JSON.stringify(dconf)}',
        '{}'
      );
      CREATE TABLE notes (
          id              integer primary key,   /* 0 */
          guid            text not null,         /* 1 */
          mid             integer not null,      /* 2 */
          mod             integer not null,      /* 3 */
          usn             integer not null,      /* 4 */
          tags            text not null,         /* 5 */
          flds            text not null,         /* 6 */
          sfld            integer not null,      /* 7 */
          csum            integer not null,      /* 8 */
          flags           integer not null,      /* 9 */
          data            text not null          /* 10 */
      );
      CREATE TABLE cards (
          id              integer primary key,   /* 0 */
          nid             integer not null,      /* 1 */
          did             integer not null,      /* 2 */
          ord             integer not null,      /* 3 */
          mod             integer not null,      /* 4 */
          usn             integer not null,      /* 5 */
          type            integer not null,      /* 6 */
          queue           integer not null,      /* 7 */
          due             integer not null,      /* 8 */
          ivl             integer not null,      /* 9 */
          factor          integer not null,      /* 10 */
          reps            integer not null,      /* 11 */
          lapses          integer not null,      /* 12 */
          left            integer not null,      /* 13 */
          odue            integer not null,      /* 14 */
          odid            integer not null,      /* 15 */
          flags           integer not null,      /* 16 */
          data            text not null          /* 17 */
      );
      CREATE TABLE revlog (
          id              integer primary key,
          cid             integer not null,
          usn             integer not null,
          ease            integer not null,
          ivl             integer not null,
          lastIvl         integer not null,
          factor          integer not null,
          time            integer not null,
          type            integer not null
      );
      CREATE TABLE graves (
          usn             integer not null,
          oid             integer not null,
          type            integer not null
      );
      ANALYZE sqlite_master;
      INSERT INTO "sqlite_stat1" VALUES('col',NULL,'1');
      CREATE INDEX ix_notes_usn on notes (usn);
      CREATE INDEX ix_cards_usn on cards (usn);
      CREATE INDEX ix_revlog_usn on revlog (usn);
      CREATE INDEX ix_cards_nid on cards (nid);
      CREATE INDEX ix_cards_sched on cards (did, queue, due);
      CREATE INDEX ix_revlog_cid on revlog (cid);
      CREATE INDEX ix_notes_csum on notes (csum);
      COMMIT;
    `;
}


/***/ }),

/***/ "./src/lib/time-to-seconds.ts":
/*!************************************!*\
  !*** ./src/lib/time-to-seconds.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.timeToSeconds = timeToSeconds;
function timeToSeconds(time) {
    const parts = time.split(':');
    const secondsParts = parts[2].includes(',') ? parts[2].split(',') : parts[2].split('.');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}


/***/ }),

/***/ "archiver":
/*!***************************!*\
  !*** external "archiver" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("archiver");

/***/ }),

/***/ "progress":
/*!***************************!*\
  !*** external "progress" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("progress");

/***/ }),

/***/ "rxjs":
/*!***********************!*\
  !*** external "rxjs" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),

/***/ "sha1":
/*!***********************!*\
  !*** external "sha1" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("sha1");

/***/ }),

/***/ "sql.js/js/sql-memory-growth":
/*!**********************************************!*\
  !*** external "sql.js/js/sql-memory-growth" ***!
  \**********************************************/
/***/ ((module) => {

module.exports = require("sql.js/js/sql-memory-growth");

/***/ }),

/***/ "srt-parser-2":
/*!*******************************!*\
  !*** external "srt-parser-2" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("srt-parser-2");

/***/ }),

/***/ "yargs":
/*!************************!*\
  !*** external "yargs" ***!
  \************************/
/***/ ((module) => {

module.exports = require("yargs");

/***/ }),

/***/ "yargs/helpers":
/*!********************************!*\
  !*** external "yargs/helpers" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("yargs/helpers");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map