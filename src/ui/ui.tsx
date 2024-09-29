import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { SubtitleBlock } from '../share/subtitle-block';
import './style.css';

import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialUiState, uiActionType, uiReducer } from './ui.reducer';
import { Progressbar } from './Progressbar';
import { exportSrt } from './export-srt';

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
      e.preventDefault();
      switch (e.code) {
        case 'ArrowRight':
          dispatch({
            type: uiActionType.next
          });
          break;
        case 'ArrowLeft':
          dispatch({
            type: uiActionType.previous
          });
          break;
        case 'Space':
          dispatch({
            type: uiActionType.togglePlay
          });
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

  const onExport = useCallback(() => {
    exportSrt(state.subtitleData, 0);
  }, [state.subtitleData])

  return (
    <>
      <video className="video" ref={videoElement} onTimeUpdate={onTimeToUpdate}>
        <source src="/video" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="controls">
        <Progressbar subtitleData={state.subtitleData} className='progressBar' selectedIndex={state.currentIndex} />
        <div className="buttons">
          <button title='Left' tabIndex={-1} onClick={onPrevious}>&lt;</button>
          <button title='Space' tabIndex={-1} onClick={onPlay}>{state.isPlaying ? 'Stop' : 'Play'} ({state.currentIndex})</button>
          <button title='Right' tabIndex={-1} onClick={onNext}>&gt;</button>
          <button tabIndex={-1} onClick={onExport}>Export</button>
        </div>
        <div className="subtitles">
          {state.subtitleData && state.subtitleData[state.currentIndex].text.map((eachSub: any, i: any) => <textarea key={`${state.currentIndex}-${i}`}>{eachSub}</textarea>)}
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
