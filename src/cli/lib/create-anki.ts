import ProgressBar from 'progress';
import path from 'path';
import { outputFileNameCalculate } from './output-file-name-calculate';
import { SubtitleBlock } from '../../share/subtitle-block';
import { splitAudio } from './split-audio';
import { CardMeta } from './type/card-meta';
import { from, lastValueFrom, mergeMap, tap } from 'rxjs';
import { AnkiExporter } from './anki-exporter';

export async function createAnki(deck: string, inputFile: string, reducedTimeAndText: SubtitleBlock[], concurrent: number) {
  const deckName = deck ? deck : path.basename(inputFile).split('.').shift();
  const prefixedInputFile = path.resolve(inputFile);
  const sanitisedDeckName = fullSanitize(deckName as string);
  console.log("Creating splitted files...");
  const { prefix, getFileName, getPrefixedFileName } = await outputFileNameCalculate(reducedTimeAndText.length);
  console.log(`Temporary directory: ${prefix}`);

  console.log();
  const green = '\x1b[32m';
  const reset = '\x1b[0m';
  const bar1 = new ProgressBar(`${green}Splitting progress (:bar) :current/:total ${reset}`, {
    complete: '\u2588',
    incomplete: '\u2591',
    clear: true,
    total: reducedTimeAndText.length
  });

  const jobAndCards = reducedTimeAndText.map((time, indx) => {
    const splitFileName = getFileName(indx);
    const prefixedSplitFileName = getPrefixedFileName(indx);

    return {
      job: splitAudio(prefixedInputFile, time.startMargin, time.endMargin, prefixedSplitFileName),
      card: { text: time.text, media: prefixedSplitFileName, fileName: splitFileName }
    }
  });

  const jobs = jobAndCards.map(jobAndCard => jobAndCard.job);
  const cardData: CardMeta[] = jobAndCards.map(jobAndCard => jobAndCard.card);

  const progressMap = new Map<string, number>();

  return lastValueFrom(from(jobs).pipe(
    mergeMap(obs => obs, concurrent),
    tap({
      next: (fileDone) => {
        progressMap.set(fileDone, 1);
        const newProgress = Array.from(progressMap.values()).reduce((prev, cur) => {
          return prev + cur;
        }, 0);

        bar1.update(newProgress / reducedTimeAndText.length);
      },
      error: e => {
        console.error(e);
      },
      complete: () => {
        bar1.terminate();
        console.log();
        buildAnki(sanitisedDeckName, cardData).then(() => {
          console.log(`${green}${sanitisedDeckName} created!${reset}`);
        }).catch(e => {
          console.error("Error in creation of anki deck.");
          console.error(e);
        })
      }
    })
  ));
}

function fullSanitize(filename: string) {
  const forbiddenChars = /[\\\/:*?"<>|]/g;
  const sanitized = filename.replace(forbiddenChars, '');
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

  if (reservedNames.test(sanitized)) {
    return sanitized + '_';
  }

  return sanitized;
}

function buildAnki(deckName: string, cardData: CardMeta[]) {
  const randomNumber = Math.random().toString().split('.')[1];
  const prefix = `${deckName}-${randomNumber}`
  return new Promise<void>((res, rej) => {
    const apkg = AnkiExporter(deckName);

    cardData.forEach(card => {
      const mediaAddress = `${prefix}-${card.fileName}`;
      const text = card.text.reduce((prev, cur, i) => {
        const style = i % 2 === 0 ? 'style="color: yellow"' : '';
        return prev + `<p ${style}>${cur}</p>`;
      }, '');
      apkg.addMedia(mediaAddress, card.media);
      apkg.addCard(`[sound:${mediaAddress}]`, `${text}`);
    });

    apkg
      .save(path.resolve(`${deckName}.apkg`))
      .then(() => {
        res();
        return;
      })
      .catch(err => rej(err.stack || err));
  });
}