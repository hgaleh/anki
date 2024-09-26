import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { SubtitleBlock } from '../share/subtitle-block';
import './style.css';

import React, { useEffect, useReducer, useRef } from 'react';
import { initialUiState, uiActionType, uiReducer } from './ui.reducer';

function App() {

  const videoElement = useRef<HTMLVideoElement>(null);

  const [state, dispatch] = useReducer(uiReducer, initialUiState);

  useEffect(() => {
    if (videoElement.current && state.subtitleData && state.subtitleData.length > 0) {
      videoElement.current.currentTime = state.subtitleData[state.currentIndex].startMargin;
    }
  }, [state.currentIndex, state.subtitleData]);

  const onPrevious = () => {
    dispatch({
      type: uiActionType.previous
    });
  }

  const onNext = () => {
    dispatch({
      type: uiActionType.next
    });
  }

  
  const onPlay = () => {
    dispatch({
      type: uiActionType.togglePlay
    });
  }

  useEffect(() => {
    fetch('/subtitle.json').then(res => {
      return res.json()
    }).then((subtitleData: SubtitleBlock[]) => {
      dispatch({
        type: uiActionType.subtitlesReceived,
        payload: subtitleData
      })
    });

    document.body.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowRight':
          onNext();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'Space':
          console.log('space');
          onPlay();
          break;
        default:
      }
    })
  }, [dispatch]);

  const onTimeToUpdate = () => {
    if (!videoElement.current) {
      return;
    }

    dispatch({
      type: uiActionType.timeToUpdate,
      payload: videoElement.current.currentTime
    });
  }

  useEffect(() => {
    if (videoElement.current) {
      if (state.isPlaying) {
        videoElement.current?.play();
      } else {
        videoElement.current.currentTime = state.subtitleData ? state.subtitleData[state.currentIndex].startMargin : 0;
        videoElement.current.pause();
      }
    }
  }, [state.isPlaying]);

  return (
    <>
      <video className="video" ref={videoElement} onTimeUpdate={onTimeToUpdate}>
        <source src="/video" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="controls">
        <progress className="progressBar" value={state.currentIndex} max={state.subtitleData ? state.subtitleData.length - 1 : 0}></progress>
        <div className="buttons">
          <button onClick={onPrevious}>&lt;</button>
          <button onClick={onPlay}>{state.isPlaying ? 'Stop' : 'Play'}</button>
          <button onClick={onNext}>&gt;</button>
        </div>
        <div className="subtitles">
          {state.subtitleData && state.subtitleData[state.currentIndex].text.map((eachSub: any, i: any) => <p key={`${state.currentIndex}-${i}`}>{eachSub}</p>)}
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

reportWebVitals();
