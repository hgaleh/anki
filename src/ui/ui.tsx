import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { SubtitleBlock } from '../share/subtitle-block';
import style from './ui.module.scss';

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
  }, [state.currentIndex]);

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

    const keydownHandler = (e: any) => {
      e.stopPropagation();
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
    }
    document.body.addEventListener('keydown', keydownHandler);

    return () => {
      document.body.removeEventListener('keydown', keydownHandler);
    }
  }, []);

  const onTimeToUpdate = (e: any) => {
    dispatch({
      type: uiActionType.timeToUpdate,
      payload: e.target.currentTime
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

  const onExport = useCallback((subtitleIndex: number) => () => {
    exportSrt(state.subtitleData as SubtitleBlock[], subtitleIndex);
  }, [state.subtitleData])

  const onSubtitleUpdate = useCallback((subtitleIndex: number) => (e: any) => {
    dispatch({
      type: uiActionType.updateSubtitleText,
      payload: {
        index: subtitleIndex,
        text: e.target.value
      }
    });
  }, [state.currentIndex]);

  const stopPropoagation = useCallback((e: any) => {
    e.stopPropagation();
  }, []);

  const preventDefault = useCallback((e: any) => {
    e.preventDefault();
  }, []);

  const addNewSubtitle = useCallback(() => {
    dispatch({
      type: uiActionType.addNewSubtitle
    })
  }, []);

  return (
    <>
      <video className={style.video} ref={videoElement} onTimeUpdate={onTimeToUpdate}>
        <source src="/video" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className={style.controls}>
        <Progressbar subtitleData={state.subtitleData as SubtitleBlock[]} className={style.progressBar} selectedIndex={state.currentIndex} />
        <div className={style.buttons} onFocus={preventDefault}>
          <button title='Left' onClick={onPrevious}>&lt;</button>
          <button title='Space' onClick={onPlay}>{state.isPlaying ? 'Stop' : 'Play'} ({state.currentIndex})</button>
          <button title='Right' onClick={onNext}>&gt;</button>
        </div>
        <div className={style.subtitles} onKeyDown={stopPropoagation}>
          {state.subtitleData && state.subtitleData[state.currentIndex].text.map((eachSub: any, i: any) => {
            return (
              <div className={style.subtitle} key={`${state.currentIndex}-${i}`}>
                <textarea value={eachSub} onChange={onSubtitleUpdate(i)} />
                <button tabIndex={-1} onClick={onExport(i)}>Export</button>
              </div>
            )
          })}
          <button onClick={addNewSubtitle} className={style.addSubtitle}>Add new</button>
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
