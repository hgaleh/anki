#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { main } = require('./lib/main');

yargs(hideBin(process.argv))
    .command(
        '$0 <input>',
        'Create anki decks using a video and its subtitle',
        (yargs) => {
            yargs
                .positional('input', {
                    describe: 'The input file path',
                    type: 'string',
                })
                .option('srt', {
                    describe: 'The SRT file(s)',
                    type: 'array',
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
                srtFileList: srt,
                convert,
                currentDir: process.cwd(),
                concurrent,
                deck
            });
        }
    )
    .help()
    .argv;
