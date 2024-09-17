#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { main } = require('./lib/main');

yargs(hideBin(process.argv))
    .command(
        '$0 <input> <srt>',
        'Create anki decks using a video and its subtitle',
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
        async ({ input, srt, convert, concurrent, deck }) => {
            await main({
                inputFile: input,
                srtFile: srt,
                convert,
                currentDir: process.cwd(),
                concurrent,
                deck
            });
        }
    )
    .help()
    .argv;
