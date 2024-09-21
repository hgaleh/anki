import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { main } from './lib/main';

interface ArgType {
    input: string;
    srt: string[];
    concurrent: number;
    deck: string;
}

yargs(hideBin(process.argv))
    .command<ArgType>(
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
                    default: []
                })
                .options('concurrent', {
                    type: 'number',
                    default: 1,
                    description: 'Maximum concurrent output files to be created'
                }).
                options('deck', {
                    alias: 'd',
                    type: 'string',
                    description: 'Anki deck name, default is the input file name'
                });
        },
        async ({ input, srt, concurrent, deck }) => {
            await main(
                input,
                srt,
                concurrent,
                deck
            );
        }
    )
    .help()
    .argv;
