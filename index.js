#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { main } = require('./lib/main');

yargs(hideBin(process.argv))
    .command(
        '$0 <input> <srt>',
        'Split the input file(video) from silent intervals and creates anki decks using subtitle file and the provided video file',
        (yargs) => {
        yargs
            .positional('input', {
                describe: 'The input file path',
                type: 'string',
            })
            .positional('srt', {
                describe: 'The SRT file',
                type: 'string',
            })
            .option('output', {
                alias: 'o',
                type: 'string',
                default: 'out',
                description: 'Output folder for splitted parts'
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
        },
        async ({ input, srt, output, convert, concurrent, deck }) => {
            await main({
                inputFile: input,
                srtFile: srt,
                outputDir: output,
                convert,
                currentDir: process.cwd(),
                concurrent,
                deck
            });
        }
    )
    .help()
    .argv;
