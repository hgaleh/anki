### Description
A CLI tool that helps creating anki decks using a video file and its corresponding subtitle. For example, you give it an mkv file name and its subtitle (in the format of srt), it splits the video file based on the silent points of the video then creates a video that contains both the video and its subtitle. It can be helpful for those who have language learning materials and need to create flashcards for them.

### Installation
You should have FFmpeg(using choco on windows and brew on linux/mac) installed and available in PATH, also install Nodejs and type the following command to install this package globally:
```bash
npm install -g @galeh/anki
```

### How to use
This is so easy to use, just take a look at the help output:

### Example usage
```bash
anki video.mp4 --srt video.srt
anki video.mp4 --srt subtitle1.srt subtitle2.srt
```

### Fine tuning
The splitting algorithm works based on the silence period between dialogues. If you find the splitting not to be accurate you will need to fine tune the following options...

 --silence:  Any noise below this db will be calculated as clear, you should configure it so that the algorithm can differ between human voice and background music. It will be tricky when the background music is loud and when the dialogue is very faint.

 --silence-duration: as the name suggests, any duration of silence less than --silence-duration will be ignored, sometimes the person, pauses in his/her speech, tune this option to make sure that those pauses do not cause splitting

 --srt:
Subtitles help the algorithm find the point of splitting, the more accurate subtitle the better

### Play option
Fine tuning can be challenging because splitting a long movie can be time consuming. I provide the --play option which runs the movie on your browser so that you can preview the splits on the fly. When you find the splits have a good accuracy, you can create your cards with confidence

```bash
anki video.mp4 --srt video.srt --silence 25 --silence-duration 0.4 --play #plays the video.mp4 on localhost:8080

```
Make sure that the movie is converted to mp4 before trying to play it because the browser will have problems with playing. use the following command to convert your film to a supported format:

```bash
ffmpeg -i inputFile -c:v libx264 -c:a aac -b:a 128k outputFile.mp4
# replace inputFile with the name of your video
# replace outputfile with an arbitrary name with .mp4 suffix
# After finishing conversion you may play your <outputFile>.mp4 file
```

### Help command output
```bash
Create anki decks using a video and its subtitle

Positionals:
  input  The input file path                                            [string]

Options:
      --version           Show version number                          [boolean]
      --help              Show help                                    [boolean]
      --srt               The SRT file(s)                  [array] [default: []]
  -c, --concurrent        Maximum concurrent output files to be created
                                                           [number] [default: 1]
  -s, --silence           silence level which detects split points in the media,
                          less silence causes more split points and more cards
                                                          [number] [default: 20]
      --silence-duration  minimum duration of silence (in seconds) that can be
                          split point, the less silence-duration the more cards
                                                         [number] [default: 0.2]
      --play              only play the split parts and do not export anything
                                                      [boolean] [default: false]
  -d, --deck              Anki deck name, default is the input file name[string]

```