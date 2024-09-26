import { SubtitleBlock } from '../../share/subtitle-block';

export function reduceTime(timesAndTexts: SubtitleBlock[]): SubtitleBlock[] {
    if (timesAndTexts.length < 2) {
        return timesAndTexts;
    }

    const reducedTimesAndTexts: SubtitleBlock[] = [];
    const areEqual = areSubtitleTextsEqual(timesAndTexts);
    let i = 0;

    while (i < timesAndTexts.length) {
        let j = i;
        for(j = i; j < timesAndTexts.length && areEqual(i, j); j++) {}
        j--; // last subtitle index which is equal
        reducedTimesAndTexts.push({
            start: timesAndTexts[i].start,
            end: timesAndTexts[j].end,
            text: timesAndTexts[i].text,
            startMargin: timesAndTexts[i].startMargin,
            endMargin: timesAndTexts[j].endMargin
        });
        i = j + 1;
    }

    return reducedTimesAndTexts;
}

function areSubtitleTextsEqual(searchArea: SubtitleBlock[]) {
    return function (i: number, j: number) {
        return searchArea[i].text[0] === searchArea[j].text[0];
    }
}