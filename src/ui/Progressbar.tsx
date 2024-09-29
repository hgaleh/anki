import React from 'react';
import { SubtitleBlock } from "../share/subtitle-block";
import { CSSProperties } from 'react';

interface Props {
    subtitleData: SubtitleBlock[]
    selectedIndex: number;
    className: string
}

export function Progressbar({ selectedIndex, subtitleData, className }: Props) {
    const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        overflow: 'hidden'
    };

    if (!subtitleData) {
        return <div></div>
    }

    const duration = subtitleData[subtitleData.length - 1].endMargin;

    const blockRepresentations: React.JSX.Element[] = [];

    for (let i = 0; i < subtitleData.length; i++) {
        const subDuration = subtitleData[i].endMargin - subtitleData[i].startMargin;
        const width = (subDuration / duration) * 100;
        const backgroundColor = i <= selectedIndex ? 'red' : 'lightgray';
        blockRepresentations.push(
            <div style={{ width: `${width}%`, backgroundColor, height: '100%' }}></div>
        )
    }

    return (
        <div style={containerStyle} className={className}>
            {blockRepresentations}
        </div>
    );
}