<div align="center">

# fginputs
#### Motion inputs Trainer.
<img alt="thumbnail" height="400" src="/readme-imgs/thumbnail.png" />
</div>

## Check it out!
Check it out at [fginputs.dee9c.com](https://fginputs.dee9c.com)

## Tutorial
(also in the website itself)
1. Press a button you want to bind, and check which button is pressed.
2. Change the text at the left side to bind the button to the input.
3. Click "Apply".
4. Go to Training and start practicing!

## Features
### .fgc files
<div align="center">
<img alt=".fgc" height="500" src="/readme-imgs/fgc.png" />
</div>
I made sort of a "programming language" for motion inputs, you can check out the tutorial.fgc file to understand how it works.
We'll focus on the features here:

- Freedom to set input names (e.g. LP, MP, HP, P, K etc.)
- Freedom to set move names
- Freedom to set multiple sequences for the same move (e.g. 2 1 4 and 2 3 6 are both quarter circles)
- Freedom to set multiple triggers for the same input (e.g. P and K could both have a dp input)
- Allow very precise inputs strings (e.g. a kara cancel is a 2 frame input, you can set it with \[\%1,\%2\])

### Radar
<div align="center">
<img alt="stick" height="250" src="/readme-imgs/stick.png" />
</div>
This was made for checking what you did wrong with the motion itself.

- A red circle will be shown if your directional input reaches that edge
- You can click on the 8 circles to toggle a white circle

### Lollipop
<div align="center">
<img alt="lollipop" height="250" src="/readme-imgs/lollipop.png" />
</div>
This was made to check the end of the motion input. <br />
Usually the last input has to be done faster than the rest of the inputs, so the lollipop is here to check if you did it right.

- The red frame shows the frame count between the second to last input (usually a directional input) and the last input, this usually should be 0~5 frames
- You can click on the boxes to toggle a white border

### Training Stats
<div align="center">
<img alt="stats" height="400" src="/readme-imgs/training-stats.png" />
</div>

- Success rate: How often is the motion input done correctly
- Average frame count: The average frame count of all inputs
- First input frames: How long is the first input done (e.g. 50 in 50+17). This is so you can practice starting from neutral and from having the first input held.
## Contributing
Open an issue if you have some suggestions!

