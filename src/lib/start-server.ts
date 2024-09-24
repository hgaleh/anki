import express from 'express';
import { SubtitleBlock } from './type/subtitle-block';
import path from 'path';

const app = express();
const port = 8080;


export function startServer(reducedTimeAndText: SubtitleBlock[], prefixedInputFile: string) {        
    app.get('/video', (req, res) => {
        res.sendFile(path.join(prefixedInputFile));
    });
    app.get('/subtitle.json', (req, res) => {
        res.json(reducedTimeAndText);
    });
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
    app.listen(port, () => {
        console.log(`server running on port ${port}`);
    })
}

// function play(reducedTimeAndText: SubtitleBlock[], prefixedInputFile: string): Promise<void> {
//     const valueController = new PlayerController(reducedTimeAndText, prefixedInputFile);
//     const green = '\x1b[32m';
//     const reset = '\x1b[0m';
//     const bar1 = new ProgressBar(`${green}Splitting progress (:bar) :current/:total ${reset}`, {
//       complete: '\u2588',
//       incomplete: '\u2591',
//       clear: false,
//       total: reducedTimeAndText.length
//     });
    
//     console.log("Left/Right to switch between parts, press r to replay");
//     console.log("Excape, Q or Ctrl + C to exit");

//     bar1.update(valueController.currentPercent());

//     readline.emitKeypressEvents(process.stdin);
//     process.stdin.setRawMode(true);

//     return new Promise((res, rej) => {
//         process.stdin.on('keypress', (str, key) => {
//             if (pressedQuitButton(key)) {
//                 console.log('Exiting...');
//                 res();
//             } else {
//                 if (key.name === 'left') {
//                     valueController.decrease();
//                     bar1.update(valueController.currentPercent());
//                 }

//                 if(key.name === 'right') {
                    
//                     if (valueController.currentPercent() === 1) {
//                         res();
//                     }

//                     valueController.increase();
//                     bar1.update(valueController.currentPercent());
//                 }

//                 if (key.name === 'p') {
//                     valueController.play();
//                 }
//             }
//         })
//     });
// }

// function pressedQuitButton(key: any): boolean {
//     return key.name === 'q' || key.name === 'Q' || key.ctrl && key.name === 'c';
// }

// class PlayerController {
//     private progressbarValue: number;
//     private readonly minValue = 1;
//     private readonly maxValue: number;

//     constructor(private readonly reducedTimeAndText: SubtitleBlock[], private readonly prefixedInputFile: string) {
//         this.maxValue = this.reducedTimeAndText.length;
//         this.progressbarValue = this.minValue;
//     }

//     increase(): void {
//         this.progressbarValue = Math.min(this.maxValue, this.progressbarValue + 1);
//     }

//     decrease(): void {
//         this.progressbarValue = Math.max(this.progressbarValue - 1, this.minValue);
//     }

//     currentPercent(): number {
//         return this.progressbarValue / this.maxValue;
//     }

//     play() { 
//         const currentPart = this.reducedTimeAndText[this.progressbarValue - 1];
//         return execSync(`ffplay -noborder -ss ${currentPart.startMargin} -t ${currentPart.endMargin - currentPart.startMargin} "${this.prefixedInputFile}" -autoexit`, { stdio: 'ignore' });
//     }
// }