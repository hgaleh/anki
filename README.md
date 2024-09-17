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

### Help command output
```bash
anki <input>

Create anki decks using a video and its subtitle

Positionals:
  input  The input file path                                            [string]

Options:
      --version     Show version number                                [boolean]
      --help        Show help                                          [boolean]
      --srt         The SRT file(s)                                      [array]
  -c, --convert     Converts the input file to mp3 before splitting
                                                      [boolean] [default: false]
      --concurrent  Maximum concurrent output files to be created
                                                          [number] [default: 10]
  -d, --deck        Anki deck name, default is the input file name      [string]

```