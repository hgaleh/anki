import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { main } from './lib/main';

interface ArgType {
    input: string;
    srt: string[];
    concurrent: number;
    deck: string;
    silence: number;
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
                    alias: 'c',
                    default: 1,
                    description: 'Maximum concurrent output files to be created'
                })
                .options('silence', {
                    type: 'number',
                    alias: 's',
                    default: 20,
                    description: 'silence level which detects split points in the media, less silence causes more split points and more cards'
                })
                .options('deck', {
                    alias: 'd',
                    type: 'string',
                    description: 'Anki deck name, default is the input file name'
                });
        },
        async ({ input, srt, concurrent, deck, silence }) => {
            await main(
                input,
                srt,
                concurrent,
                deck,
                silence
            );
        }
    )
    .help()
    .argv;
