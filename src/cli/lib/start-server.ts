import express from 'express';
import { SubtitleBlock } from '../../share/subtitle-block';
import path from 'path';

const app = express();
const port = 8080;


export function startServer(reducedTimeAndText: SubtitleBlock[], prefixedInputFile: string) {
    app.use(express.static(path.join(__dirname, '..', 'ui')));
        
    app.get('/video', (req, res) => {
        res.sendFile(path.join(prefixedInputFile));
    });

    app.get('/subtitle.json', (req, res) => {
        res.json(reducedTimeAndText);
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`server running on port http://localhost:${port}`);
    })
}
