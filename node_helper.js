var NodeHelper = require("node_helper");
var WebSocketServer = require("ws").Server;
const fs = require("fs");
const Log = require("../../js/logger");

module.exports = NodeHelper.create({

    socketNotificationReceived: function(notification, payload) {
        Log.log(this.name + " received a socket notification: " + notification);
        // send stop to hide the game module
        this.sendSocketNotification('STOP');
    },

    start: function() {
        Log.log("Starting node helper for: " + this.name);

        this.wss = new WebSocketServer({port: 9090});
        this.player_connected = false;
        this.game_running = false;
        this.conn_game;
        this.conn_player;
	this.highscore = "0";

	fs.readFile(this.path + "/highscore", "utf-8", (err, data) => {
		if (err) {
			console.log("Error reading highscore file " + err);
		} else {
			this.highscore = data;
		}
	});

        this.wss.on('connection', (connection) => {

            function sendTo(connection, message) { 
                connection.send(JSON.stringify(message)); 
            }

            connection.on('message', (message) => {
                var data;
                
                //accepting only JSON messages 
                try { 
                    data = JSON.parse(message); 
                } catch (e) { 
                    Log.log(this.name + ": Invalid JSON");
                    data = {};
                    return;
                }

                //switching type of the user message 
                switch (data.type) {
                    case "playerready":
                        console.log("player connected");
                        this.sendSocketNotification('PLAY', '');
                        break;
                    
                    case "gameready":
                        this.game_running = true;
                        this.conn_game = connection;
			sendTo(this.conn_game, {
				type: "highscore",
				value: this.highscore
			});	
                        break;

                    case "play":
                        this.conn_player = connection;
                        if(this.game_running && !this.player_connected){ 
                            this.player_connected = true;
                            sendTo(this.conn_player, { 
                                type: "play", 
                                success: true 
                            });
                        } else {
                            sendTo(this.conn_player, { 
                                type: "play", 
                                success: false 
                            });
                        }  
                        break;

                    case "offer":                                       
                        if(this.game_running && this.player_connected){ 
                            sendTo(this.conn_game, { 
                                type: "offer", 
                                offer: data.offer, 
                            });
                            sendTo(this.conn_player, { 
                                type: "offer", 
                                success: true 
                            });
                        } else {
                            sendTo(this.conn_player, { 
                                type: "offer", 
                                success: false 
                            });
                        }  
                        break;

                    case "answer":                     
                        if(this.conn_player != null) { 
                            sendTo(this.conn_player, { 
                                type: "answer", 
                                answer: data.answer 
                            }); 
                        } 
                        break;

                    case "candidate":
                        var conn;
                        if (data.name == "game") {
                            conn = this.conn_player;
                        } else {
                            conn = this.conn_game;
                        }
                            
                        if(conn != null) {
                            sendTo(conn, { 
                                type: "candidate", 
                                candidate: data.candidate 
                            }); 
                        }                  
                        break;

		    case "highscore":
			fs.writeFile(this.path + "/highscore", data.value, err => {
			    if (err) {
			        Log.log(err);
			    }
			});
			this.highscore = data.value;
			break;

                    case "leave": 
                        var conn;
                        if (data.name == "game") {
                            this.conn_game = null;
                            conn = this.conn_player;
                        } else {
                            this.conn_player = null;
                            conn = this.conn_game;
                        }
                            
                        //notify the other user so he can disconnect his peer connection 
                        if(conn != null) { 
                            sendTo(conn, { 
                                type: "leave" 
                            }); 
                        }                    
                        break;
                                    
                    default: 
                        sendTo(connection, { 
                            type: "error", 
                            message: "Command no found: " + data.type 
                        }); 
                        break; 
                }
            });

            connection.on("close", () => {
                this.conn_player = null;
                this.player_connected = false;
                this.game_running = false;
                if(this.conn_game != null) { 
                    sendTo(this.conn_game, { 
                        type: "leave" 
                    });
                }
            });
        })
    },
});
