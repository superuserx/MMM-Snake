Module.register("MMM-Snake", {

    getStyles: function() {
        return [ this.file('public/snake.css') ];
    },

    getDom: function() {
        if (!this.gameRunning) {
            var startscreen = document.createElement("div");

	    var text_div = document.createElement("div");
            text_div.style.fontFamily = "gameFont";
            text_div.style.fontSize = "200px";
            text_div.style.textAlign = "center";
	    text_div.style.marginTop = "300px";
            var text = document.createTextNode("SNAKE");

	    var text_div2 = document.createElement("div");
	    text_div2.style.fontFamily = "gameFont";
	    text_div2.style.textAlign = "center";
	    text_div2.style.fontSize = "100px";
	    text_div2.style.marginTop = "90px";
	    var text2 = document.createTextNode("Press Play");

            text_div.appendChild(text);
	    text_div2.appendChild(text2);

            //startscreen.appendChild(img);
            startscreen.appendChild(text_div);
	    startscreen.appendChild(text_div2);
            return startscreen;
        }

        var canvas = document.createElement("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var ctx = canvas.getContext("2d");

        gameOver = () => {
            drawText(
                "Game over",
                "150px gameFont",
                canvas.width/2 - 330,
                canvas.height/2                    
            );
            clearInterval(this.gameLoop);
            this.gameover = true;
	    if (this.score > this.highscore) {
		drawText(
		   "New Highscore!",
		   "100px gameFont",
		   canvas.width/2 - 330,
		   canvas.height/2 + 200
		);
	    	this.send({
		    type: "highscore",
		    value: this.score
		});
		this.highscore = this.score;
	    }
        }
        
        function drawText(text, font, x, y) {
            ctx.beginPath();
            ctx.font = font;
            //ctx.font.fontSize = "50px";
            ctx.fillText(text, x, y);
            ctx.closePath();
        }

        // move snake in next pos
        this.snakeX += this.nextX;
        this.snakeY += this.nextY;

        // snake over game world?
        if (this.snakeX < 0) {
            this.snakeX = this.gridSizeX - 1;
        }
        if (this.snakeX > this.gridSizeX - 1) {
            this.snakeX = 0;
        }

        if (this.snakeY < 0) {
            this.snakeY = this.gridSizeY - 1;
        }
        if (this.snakeY > this.gridSizeY - 1) {
            this.snakeY = 0;
        }

        //snake bite apple?
        if (this.snakeX == this.appleX && this.snakeY == this.appleY) {
            this.tailSize += 2;
            this.score += 10;

            this.appleX = Math.floor(Math.random() * this.gridSizeX);
            this.appleY = Math.floor(Math.random() * this.gridSizeY);
        }

        //paint background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // paint snake
        ctx.fillStyle = "white";
        for (var i = 0; i < this.snakeTrail.length; i++) {
            ctx.fillRect(
            this.snakeTrail[i].x * this.tileSize,
            this.snakeTrail[i].y * this.tileSize,
            this.tileSize-5,
            this.tileSize-5
            );

            //snake bites it's tail?
            if (this.snakeTrail[i].x == this.snakeX && this.snakeTrail[i].y == this.snakeY) {
                gameOver();
            }
        }

        // paint score
        ctx.beginPath();
        ctx.font = "40px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Score: " + this.score, 10, canvas.height - 10);
	ctx.fillText("Highscore: " + this.highscore, 490, canvas.height - 10);
        ctx.closePath();

        // paint apple
        ctx.fillStyle = "white";
        ctx.fillRect(this.appleX * this.tileSize, this.appleY * this.tileSize, this.tileSize-5, this.tileSize-5);

        //set snake trail
        this.snakeTrail.push({ x: this.snakeX, y: this.snakeY });
        while (this.snakeTrail.length > this.tailSize) {
            this.snakeTrail.shift();
        }

        return canvas;
    },

    start: function() {
        Log.log("Starting module: ", this.name);

        //setup signal server connection
        this.SignalConnection = new WebSocket('ws://192.168.178.25:9090');

        this.SignalConnection.onmessage = (message) => { 
            var data = JSON.parse(message.data); 

            switch(data.type) { 
                case "offer":
                    this.onOffer(data.offer, data.name); 
                    break; 
                case "candidate": 
                    this.onCandidate(data.candidate); 
                    break;
		case "highscore":
		    this.highscore = data.value;
		    break;
                case "leave":
		    clearInterval(this.gameLoop);
		    this.start();
                    break;
                default: 
                    break; 
            } 
        };

        this.SignalConnection.onopen = () => {
            this.send({type: "gameready"});
        };

        this.SignalConnection.onerror = (err) => { 
            console.log("Got error", err); 
        };

        //creating our RTCPeerConnection object 	
        this.configuration = {}; 
        this.RTCConnection = new RTCPeerConnection(this.configuration);
        this.openDataChannel();

        //setup ice handling
        //when the browser finds an ice candidate we send it to another peer 
        this.RTCConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.send({ 
                    type: "candidate", 
                    candidate: event.candidate 
                });
            } 
        };

        this.RTCConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;

            this.dataChannel.onerror = function (error) { 
                console.log("Error:", error); 
            };
                
            this.dataChannel.onmessage = function (event) { 
                console.log("RTC message:", event.data); 
            };  
        };

        // game world
        this.tileSize = 30;
        this.gridSizeX = Math.ceil(window.innerWidth / this.tileSize);
        this.gridSizeY = Math.ceil(window.innerHeight / this.tileSize);

        this.nextX = 1;
        this.nextY = 0;

        // snake
        this.defaultTailSize = this.config.startsize;
        this.tailSize = this.defaultTailSize;
        this.snakeTrail = [];
        this.snakeX = 10;
        this.snakeY = 10;

        // apple
        this.appleX = Math.floor(Math.random() * this.gridSizeX);
        this.appleY = Math.floor(Math.random() * this.gridSizeY);

        // score
        this.score = 0;

        // render X times per second
        this.x = this.config.speed;

        this.gameRunning = false;
        this.gameover = false;
        this.sendSocketNotification('ready');
	this.updateDom();
    },

    // only notifications from node_helper
    socketNotificationReceived: function (notification, payload) {
        switch(notification) {
            case 'PLAY':
                this.showGame();
                break;
            case 'STOP':
                this.hideGame();
                break;
            default:
                break;
        }
    }, 

    showGame: function () {
	var self = this;
        self.show(1000, function () {
                //Log.log(self.name + ' is shown.');
        }, {lockString: self.identifier});
        MM.getModules().exceptModule(self).enumerate(function (module) {
                module.hide(1000, function() {
                        //Log.log(module.name + 'is hidden.');
                }, {lockString: self.identifier});
		//Log.log(module.lockStrings);
        });
    },

    hideGame: function () {
	var self = this;
        this.hide(1000, function () {
		//Log.log(self.name + ' is hidden.');
        }, {lockString: self.identifier});
        MM.getModules().exceptModule(self).enumerate(function (module) {
                module.show(1000, function () {
                        //Log.log(module.name + ' is shown.');
                }, {lockString: self.identifier});
        });
    },

    openDataChannel: function() {
        var dataChannelOptions = { 
            reliable:false
        }; 
        this.dataChannel = this.RTCConnection.createDataChannel("myDataChannel", dataChannelOptions);
            
        this.dataChannel.onerror = function (error) { 
            console.log("Error:", error); 
        };
            
        this.dataChannel.onmessage = (event) => { 
            this.remoteCommand(event.data);
        };
    },

    onOffer: async function (offer, name) { 
        await this.RTCConnection.setRemoteDescription(offer);
        answer = await this.RTCConnection.createAnswer();
        await this.RTCConnection.setLocalDescription(answer);
        this.send({type: "answer", answer: answer});
        this.gameRunning = true;    
        this.gameLoop = setInterval(() => {
            this.updateDom();
        }, 1000 / this.x);
    },

    //when we got ice candidate from another user 
    onCandidate: async function (candidate) {
        await this.RTCConnection.addIceCandidate(candidate);
    },

    // Alias for sending messages in JSON format 
    send: function (message) {
        message.name = "game";
        this.SignalConnection.send(JSON.stringify(message)); 
    },

    resetGame: function() {
        this.tailSize = this.defaultTailSize;
        this.snakeTrail = [];
        this.snakeX = 10;
        this.snakeY = 10;
        this.score = 0;
        this.nextX = 1;
        this.nextY = 0;
        this.gameLoop = setInterval(() => {
            this.updateDom();
        }, 1000 / this.x);
    },

    // input webrtc
    remoteCommand: function (command) {
        if (this.gameover) {
            this.gameover = false;
            this.resetGame();
            return;
        }
        switch (command) {
            case "l": // left
                if (this.nextX != 1) {
                    this.nextX = -1;
                    this.nextY = 0;
                }
            break;
            case "u": // up
                if (this.nextY != 1) {
                    this.nextX = 0;
                    this.nextY = -1;
                }
            break;
            case "r": // right
                if (this.nextX != -1) {
                    this.nextX = 1;
                    this.nextY = 0;
                }
            break;
            case "d": // down
                if (this.nextY != -1) {
                    this.nextX = 0;
                    this.nextY = 1;
                }
            break;
        }
    }
});















