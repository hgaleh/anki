import { SubtitleBlock } from "../share/subtitle-block";

interface StateType {
    isPlaying: boolean;
    currentIndex: number;
    subtitleData: SubtitleBlock[] | null;
}

export const initialUiState: StateType = {
    currentIndex: 0,
    isPlaying: false,
    subtitleData: null,
}
  
  export function uiReducer(state: StateType, action: any) {
    switch(action.type) {
      case uiActionType.previous:
        {
          const currentIndex = Math.max(0, state.currentIndex - 1);
          return {...state, ...{ currentIndex }};
        }
      case uiActionType.next:
        {
          if (!state.subtitleData) {
            return state;
          }
          const currentIndex = Math.min(state.subtitleData.length - 1, state.currentIndex + 1);
          return {...state, ...{ currentIndex }};
        }
      case uiActionType.subtitlesReceived:
        {
          const subtitleData = action.payload;
          return { ...state, subtitleData };
        }
      case uiActionType.timeToUpdate:
        {
          if (!state.subtitleData) {
            return state;
          }
          const currentTime = action.payload;

          const currentSubtitle = state.subtitleData[state.currentIndex];
  
          const isPlayTime = (currentTime <= currentSubtitle.endMargin) && (currentTime > currentSubtitle.startMargin);
          return { ...state, ...{ isPlaying: isPlayTime } };
        }
      case uiActionType.togglePlay:
        {
          return { ...state, ...{ isPlaying: !state.isPlaying } };
        }
      default:
        return state;
    }
  }

  export enum uiActionType {
    previous = 'previous',
    next = 'next',
    subtitlesReceived = 'subtitlesReceived',
    timeToUpdate = 'timeToUpdate',
    togglePlay = 'togglePlay',
  }