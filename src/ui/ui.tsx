import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { SubtitleBlock } from '../share/subtitle-block';
import './style.css';

import React, { useEffect, useRef, useState } from 'react';

interface VideoEvent {
  target: HTMLVideoElement
}

function App() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [subtitleData, setSubtitleData] = useState<SubtitleBlock[] | null>(null);
  const videoElement = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch('/subtitle.json').then(res => {
      return res.json()
    }).then((subtitleData: SubtitleBlock[]) => {
      setSubtitleData(subtitleData);
    });
  }, []);

  const onTimeToUpdate = (e: any) => {
    if (!subtitleData) {
      return;
    }

    const currentSub = subtitleData[currentIndex];

    if (e.target.currentTime >= currentSub.endMargin) {
      e.target.pause();
    }
  }

  const onVideoPlayed = () => {
    if (!subtitleData || !videoElement.current) {
      return;
    }

    if (videoElement.current.currentTime < subtitleData[currentIndex].startMargin || videoElement.current.currentTime > subtitleData[currentIndex].endMargin) {
      videoElement.current.currentTime = subtitleData[currentIndex].startMargin; // Set the start point at 1 second
    }
  }

  const onNext = () => {
    if (!subtitleData) {
      return;
    }

    videoElement.current?.pause();

    if (currentIndex < subtitleData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  const onPrevious = () => {
    videoElement.current?.pause();

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  const onPlay = () => {
    videoElement.current?.play();
  }

  return (
    <>
      <video className="video" ref={videoElement} onTimeUpdate={onTimeToUpdate} onPlay={onVideoPlayed}>
        <source src="/video" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="controls">
        <progress className="progressBar" value={currentIndex} max={subtitleData ? subtitleData.length - 1 : 0}></progress>
        <div className="buttons">
          <button onClick={onPrevious}>&lt;</button>
          <button onClick={onPlay}>&triangleright;</button>
          <button onClick={onNext}>&gt;</button>
        </div>
        <div className="subtitles">
          {subtitleData && subtitleData[currentIndex].text.map((eachSub, i) => <p key={`${currentIndex}-${i}`}>{eachSub}</p>)}
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
