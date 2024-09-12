#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { main } = require('./lib/main');
const path = require('path');

yargs(hideBin(process.argv))
    .command(
        '$0 <input> <srt>',
        'Split the input file(video or sound) using the given srt file',
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
            .option('margin', {
                alias: 'm',
                type: 'number',
                default: 0.1,
                description: 'By default the input file is splitted 0.1s before subtitle starts and ends, you can change this time by specifying the margin. The unit is second'
            })
            .options('concurrent', {
                type: 'number',
                default: 10,
                description: 'Maximum concurrent output files to be created'
            });
        },
        async ({ input, srt, output, convert, margin, concurrent }) => {
            await main({
                inputFile: input,
                srtFile: srt,
                outputDir: output,
                convert,
                currentDir: process.cwd(),
                margin,
                concurrent
            });
        }
    )
    .help()
    .argv;
