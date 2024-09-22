import { reduceTime } from '../../src/lib/reduce-time';
import { SubtitleBlock } from '../../src/lib/type/subtitle-block';

describe('reduce time function', () => {
    it('empty input', () => {
        const subtitleBlockList: SubtitleBlock[] = [];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 0);
    });
    
    it('one input returns one subtitle', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            end: 2,
            start: 1,
            text: []
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            end: 2,
            start: 1,
            text: []
        });
    });

    it('two subtitles given and they are not same, should return both', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            start: 1,
            end: 2,
            text: []
        }, {
            start: 3,
            end: 4,
            text: ['some other text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 2);
        expect(res[0]).toEqual({
            start: 1,
            end: 2,
            text: []
        });
        expect(res[1]).toEqual({
            start: 3,
            end: 4,
            text: ['some other text']
        })
    });

    it('two subtitles with same text should return only one subtitle', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            start: 1,
            end: 2,
            text: ['some text']
        }, {
            start: 3,
            end: 4,
            text: ['some text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            start: 1,
            end: 4,
            text: ['some text']
        });
    });

    it('two equal subtitles with empty text', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            start: 1,
            end: 2,
            text: []
        }, {
            start: 3,
            end: 4,
            text: []
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            start: 1,
            end: 4,
            text: []
        });
    });

    it('more than two equal subtitles', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            start: 1,
            end: 2,
            text: []
        }, {
            start: 3,
            end: 4,
            text: []
        }, {
            start: 5,
            end: 6,
            text: []
        },{
            start: 7,
            end: 8,
            text: ['some text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 2);
        expect(res[0]).toEqual({
            start: 1,
            end: 6,
            text: []
        });
        expect(res[1]).toEqual({
            start: 7,
            end: 8,
            text: ['some text']
        })
    });
})