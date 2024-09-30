import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { main } from './lib/main';

interface ArgType {
    input: string;
    srt: string[];
    concurrent: number;
    deck: string;
    silence: number;
    silenceDuration: number;
    play: boolean;
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
                .option('concurrent', {
                    type: 'number',
                    alias: 'c',
                    default: 1,
                    description: 'Maximum concurrent output files to be created'
                })
                .option('silence', {
                    type: 'number',
                    alias: 's',
                    default: 20,
                    description: 'silence level which detects split points in the media, less silence causes more split points and more cards'
                })
                .option('silence-duration', {
                    type: 'number',
                    default: 0.2,
                    description: 'minimum duration of silence (in seconds) that can be split point, the less silence-duration the more cards'
                })
                .option('play', {
                    type: 'boolean',
                    default: false,
                    description: 'only play the split parts and do not export anything'
                })
                .option('deck', {
                    alias: 'd',
                    type: 'string',
                    description: 'Anki deck name, default is the input file name'
                });
        },
        async ({ input, srt, concurrent, deck, silence, silenceDuration, play, cache }) => {
            await main(
                input,
                srt,
                concurrent,
                deck,
                silence,
                silenceDuration,
                play
            ).catch(console.error);
        }
    )
    .help()
    .argv;
