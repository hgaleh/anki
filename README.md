### Description
A cli tool that helps splitting the vide and mp3 files according to their subtitle. For example you give it a mp3 file name and its subtitle (in the format of srt), it splits the mp3 file from the start to end of each subtitle part. It can be helpful for those who have language learning materials and need to create flashcards for them.

The outputted voices and videos can be easily matched with their subtitle counterpart to create flashcards in programs like Anki
 
### How it works
```bash
split <input> <srt>

Split the input file(video or sound) using the given srt file

Positionals:
  input  The input file path                                            [string]
  srt    The SRT file                                                   [string]

Options:
      --version  Show version number                                   [boolean]
      --help     Show help                                             [boolean]
  -o, --output   Output folder for splitted parts      [string] [default: "out"]
  -c, --convert  Converts the input file to mp3 before splitting
                                                      [boolean] [default: false]
  -m, --margin   By default the input file is splitted 0.1s before subtitle
                 starts and ends, you can change this time by specifying the
                 margin. The unit is second              [number] [default: 0.1]

```