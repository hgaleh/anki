```bash
split <input> <srt>
```
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