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
          return Object.assign({}, state, { currentIndex });
        }
      case uiActionType.next:
        {
          if (!state.subtitleData) {
            return state;
          }
          const currentIndex = Math.min(state.subtitleData.length - 1, state.currentIndex + 1);
          return Object.assign({}, state, { currentIndex });
        }
      case uiActionType.subtitlesReceived:
        {
          const subtitleData = action.payload;
          return Object.assign({}, state, {subtitleData});
        }
      case uiActionType.timeToUpdate:
        {
          if (!state.subtitleData) {
            return state;
          }
          const currentTime = action.payload;

          const currentSubtitle = state.subtitleData[state.currentIndex];
  
          const isPlayTime = (currentTime <= currentSubtitle.endMargin) && (currentTime > currentSubtitle.startMargin);
          return Object.assign({}, state, { isPlaying: isPlayTime });
        }
      case uiActionType.togglePlay:
        {
          return Object.assign({}, state, { isPlaying: !state.isPlaying });
        }
      case uiActionType.updateSubtitleText:
        {
          if (!state.subtitleData) {
            return state;
          }
          const { index, text } = action.payload;
          const newSubtitleData = state.subtitleData.map((block, blockIndex) => {
            const newText = block.text.map((currentText, subtitleIndex) => {
              return (subtitleIndex === index && blockIndex === state.currentIndex) ? text : currentText;
            })
            return Object.assign({}, block, { text: newText });
          });

          return Object.assign({}, state, { subtitleData: newSubtitleData });
        }
      case uiActionType.addNewSubtitle:
        {
          if (!state.subtitleData) {
            return state;
          }
          const newSubtitleData = state.subtitleData.map(block => {
            const newText = block.text.slice();
            newText.push('');
            return Object.assign({}, block, { text: newText });
          });
          return Object.assign({}, state, { subtitleData: newSubtitleData });
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
    updateSubtitleText = 'updateSubtitleText',
    addNewSubtitle = 'addNewSubtitle'
  }