import { AnkiExporter } from './anki-exporter';
import path from 'path';
import { CardMeta } from './type/card-meta';

export function createAnki(deckName: string, cardData: CardMeta[]) {
  const randomNumber = Math.random().toString().split('.')[1];
  const prefix = `${deckName}-${randomNumber}`
  return new Promise<void>((res, rej) => {
    const apkg = AnkiExporter(deckName);
   
    cardData.forEach(card => {
      const mediaAddress = `${prefix}-${card.fileName}`;
      const text = card.text.reduce((prev, cur) => {
        return prev + `<p>${cur}</p>`;
      }, '');
      apkg.addMedia(mediaAddress, card.media);
      apkg.addCard(`[sound:${mediaAddress}]`, `${text}`);
    });

    apkg
      .save(path.resolve(`${deckName}.apkg`))
      .then(() => {
        res();
      })
      .catch(err => rej(err.stack || err));
  });
}
