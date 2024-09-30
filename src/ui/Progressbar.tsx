import React from 'react';
import { SubtitleBlock } from "../share/subtitle-block";
import style from './Progressbar.module.scss';

interface Props {
    subtitleData: SubtitleBlock[]
    selectedIndex: number;
    className: string
}

export function Progressbar({ selectedIndex, subtitleData, className }: Props) {

    if (!subtitleData) {
        return <div></div>
    }

    const duration = subtitleData[subtitleData.length - 1].endMargin;

    const blockRepresentations: React.JSX.Element[] = [];

    for (let i = 0; i < subtitleData.length; i++) {
        const subDuration = subtitleData[i].endMargin - subtitleData[i].startMargin;
        const width = (subDuration / duration) * 100;
        const classList = [style.block];
        (i <= selectedIndex) && classList.push(style.passed);
        (i === selectedIndex) && classList.push(style.last);

        blockRepresentations.push(
            <div key={subtitleData[i].start} className={classList.join(' ')}  style={{ width: `${width}%` }}></div>
        )
    }

    return (
        <div className={`${className} ${style.container}`}>
            {blockRepresentations}
        </div>
    );
}