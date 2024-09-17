const fs = require('fs');
const AnkiExport = require('anki-apkg-export').default;
 
exports.createAnki = function(deckName, cardData, prefix) {
  return new Promise((res, rej) => {
    const apkg = new AnkiExport(deckName);
   
    cardData.forEach(card => {
      const mediaAddress = `${prefix}-${card.fileName}`;
      const text = card.text.reduce((prev, cur) => {
        return prev + `<p>${cur}</p>`;
      }, '');
      apkg.addMedia(mediaAddress, fs.readFileSync(card.media));
      apkg.addCard(`[sound:${mediaAddress}]`, `${text}`);
    });

    apkg
      .save()
      .then(zip => {
        fs.writeFileSync(`./${deckName}.apkg`, zip, 'binary');
        res();
      })
      .catch(err => rej(err.stack || err));
  });
}