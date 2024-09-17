const { AnkiExporter } = require('./anki-exporter');
 
exports.createAnki = function(deckName, cardData, prefix) {
  return new Promise((res, rej) => {
    const apkg = new AnkiExporter(deckName);
   
    cardData.forEach(card => {
      const mediaAddress = `${prefix}-${card.fileName}`;
      const text = card.text.reduce((prev, cur) => {
        return prev + `<p>${cur}</p>`;
      }, '');
      apkg.addMedia(mediaAddress, card.media);
      apkg.addCard(`[sound:${mediaAddress}]`, `${text}`);
    });

    apkg
      .save(`./${deckName}.apkg`)
      .then(() => {
        res();
      })
      .catch(err => rej(err.stack || err));
  });
}