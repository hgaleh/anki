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
            text: [],
            startMargin: 0,
            endMargin: 3
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            end: 2,
            start: 1,
            text: [],
            startMargin: 0,
            endMargin: 3
        });
    });

    it('two subtitles given and they are not same, should return both', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            startMargin: 0,
            start: 1,
            end: 2,
            endMargin: 3,
            text: []
        }, {
            startMargin: 4,
            start: 5,
            end: 6,
            endMargin: 7,
            text: ['some other text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 2);
        expect(res[0]).toEqual({
            startMargin: 0,
            start: 1,
            end: 2,
            endMargin: 3,
            text: []
        });
        expect(res[1]).toEqual({
            startMargin: 4,
            start: 5,
            end: 6,
            endMargin: 7,
            text: ['some other text']
        })
    });

    it('two subtitles with same text should return only one subtitle', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            startMargin: 1,
            start: 2,
            end: 3,
            endMargin: 4,
            text: ['some text']
        }, {
            startMargin: 5,
            start: 6,
            end: 7,
            endMargin: 8,
            text: ['some text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            startMargin: 1,
            start: 2,
            end: 7,
            endMargin: 8,
            text: ['some text']
        });
    });

    it('two equal subtitles with empty text', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            startMargin: 1,
            endMargin: 4,
            start: 2,
            end: 3,
            text: []
        }, {
            startMargin: 5,
            endMargin: 8,
            start: 6,
            end: 7,
            text: []
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 1);
        expect(res[0]).toEqual({
            startMargin: 1,
            start: 2,
            end: 7,
            endMargin: 8,
            text: []
        });
    });

    it('more than two equal subtitles', () => {
        const subtitleBlockList: SubtitleBlock[] = [{
            startMargin: 1,
            start: 2,
            end: 3,
            endMargin: 4,
            text: []
        }, {
            startMargin: 5,
            start: 6,
            end: 7,
            endMargin: 8,
            text: []
        }, {
            startMargin: 9,
            start: 10,
            end: 11,
            endMargin: 12,
            text: []
        },{
            startMargin: 13,
            start: 14,
            end: 15,
            endMargin: 16,
            text: ['some text']
        }];
        const res = reduceTime(subtitleBlockList);
        expect(res.length === 2);
        expect(res[0]).toEqual({
            startMargin: 1,
            start: 2,
            end: 11,
            endMargin: 12,
            text: []
        });
        expect(res[1]).toEqual({
            startMargin: 13,
            start: 14,
            end: 15,
            endMargin: 16,
            text: ['some text']
        })
    });
})