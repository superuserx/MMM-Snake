# MMM-Snake
This is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror).

Play the retro game Snake on your mirror using your smartphone :video_game: :snake: :iphone:

<p float="center">
	<img src="snake_start.png" alt="drawing" width="300"/>
	<img src="snake_game.png" alt="drawing" width="300"/>
</p>

## Installation
Clone repository:
```
cd MagicMirror/modules/
git clone https://github.com/superuserx/MMM-Snake.git
```

Add module to config.js:
```
{
	module: "MMM-Snake",
	position: "fullscreen_below",
	config: {
		startsize: 5,
		speed: 5
	}
}
```
### Important
You have to set the *address* to an accessible interface (or 0.0.0.0) and add the IP address of the device you want to use as a controller to *ipWhitelist* or allow all IP addresses in config.js.

Your controller device must be on the same network.

## Options
| Option | Description |
|--------|-------------|
| startsize | Snake size at start |
| speed | Game speed |

## How to play
1. Open ***yourmirroripaddress:yourmirrorport/MMM-Snake/player.html*** on your smartphone webbrowser
2. Press play

The module is hidden by default. Only when you open *player.html* on your controller device, the snake module will be shown and all other modules will be hidden.
When the connection is closed, the game is reset and hidden. All other modules will be shown again.
