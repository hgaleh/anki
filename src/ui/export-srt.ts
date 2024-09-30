import SrtParser from 'srt-parser-2';
import { SubtitleBlock } from '../share/subtitle-block';

interface SrtParserFormat {
    id: string;
    startTime: string;
    startSeconds: number;
    endTime: string;
    endSeconds: number;
    text: string;
}

export function exportSrt(subtitleData: SubtitleBlock[], subtitleIndex: number) {
    const converted: SrtParserFormat[] = subtitleData.map((eachBlock, i) => {
        return {
            endSeconds: eachBlock.end,
            endTime: toSrtTime(eachBlock.end),
            id: i.toString(),
            startSeconds: eachBlock.start,
            startTime: toSrtTime(eachBlock.start),
            text: eachBlock.text[subtitleIndex]
        }
    })
    const parser = new SrtParser();
    const srtText = parser.toSrt(converted);
    downloadTextFile(srtText, 'subtitle.srt');
}

function toSrtTime(seconds: number): string {
    const onlyMiliseconds = String(Math.floor((seconds - Math.floor(seconds)) * 1000)).padEnd(3, '0');
    const onlySeconds = String(Math.floor(seconds) % 60).padStart(2, '0');
    const onlyMinutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
    const onlyHours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    return `${onlyHours}:${onlyMinutes}:${onlySeconds},${onlyMiliseconds}`;
}


function downloadTextFile(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  