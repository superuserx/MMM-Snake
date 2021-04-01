// var connection = new WebSocket('ws://192.168.178.25:9090'); 
var connection = new WebSocket('ws://8197dee08bf7.ngrok.io')
var name = ""; 

var padContainer = document.getElementById('dpad-container');
var logo = document.getElementById('logo');
var buttonPlay = document.getElementById('btnPlay');
var buttonUp = document.getElementById('btnUp'); 
var buttonDown = document.getElementById('btnDown'); 
var buttonRight = document.getElementById('btnRight'); 
var buttonLeft = document.getElementById('btnLeft');

var connectedUser, myConnection, dataChannel;
var offer, answer;
var cands = [];
  
btnPlay.addEventListener("click", function(event){ 
    send({ 
        type: "play", 
    });
    btnPlay.style.visibility = "hidden";
    padContainer.style.visibility = "visible";
});

//handle messages from the server 
connection.onmessage = function (message) { 
    console.log("Server message", message.data);
    var data = JSON.parse(message.data); 

    switch(data.type) { 
        case "play": 
            onPlay(data.success); 
            break; 
        case "answer": 
            onAnswer(data.answer); 
            break; 
        case "candidate": 
            onCandidate(data.candidate); 
            break;
        default: 
            break; 
    } 
};
  
//when a user logs in 
async function onPlay(success) { 
    if (success === false) { 
        alert("oops...offer failed"); 
    } else { 
        //creating our RTCPeerConnection object 	
        var configuration = { 
            //"iceServers": [{ "urls": "stun:stun.1.google.com:19302" }] 
        }; 
		
        myConnection = new RTCPeerConnection(configuration);
        openDataChannel();

        console.log("RTCPeerConnection object was created"); 
        console.log(myConnection); 
  
        //setup ice handling
        //when the browser finds an ice candidate we send it to another peer 
        myConnection.onicecandidate = function (event) {
            if (event.candidate) { 
                send({ 
                    type: "candidate", 
                    candidate: event.candidate 
                }); 
            } 
        };

        myConnection.ondatachannel = function (event) {
            dataChannel = event.channel;
            console.log("received dataChannel invite");

            dataChannel.onerror = function (error) { 
                console.log("Error:", error); 
            };
                
            dataChannel.onmessage = function (event) { 
                console.log("RTC message:", event.data); 
            };  
        };

        //make an offer
        var offer = await myConnection.createOffer();
        await myConnection.setLocalDescription(offer);
        send({type: "offer", offer: myConnection.localDescription});
    }
};

//when another user answers to our offer 
function onAnswer(answer) {
    myConnection.setRemoteDescription(new RTCSessionDescription(answer));

    for (var i=0; i<cands.length; i++) {
        myConnection.addIceCandidate(cands[i]);
    }
}

//when we got ice candidate from another user 
function onCandidate(candidate) {
    if (!myConnection.setRemoteDescription) {
        cands.push(candidate);
    } else {
        myConnection.addIceCandidate(candidate);
    }
}

connection.onopen = function () { 
   console.log("Connected"); 
   send({type: "playerready"});
};
  
connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
// Alias for sending messages in JSON format 
function send(message) {
    message.name = "player"; 
    connection.send(JSON.stringify(message)); 
};

//creating data channel 
function openDataChannel() { 
    var dataChannelOptions = { 
        reliable:false 
    }; 
    
    dataChannel = myConnection.createDataChannel("myDataChannel", dataChannelOptions);
    console.log("opened dataChannel");
        
    dataChannel.onerror = function (error) { 
        console.log("Error:", error); 
    };
        
    dataChannel.onmessage = function (event) { 
        console.log("RTC message:", event.data); 
    };  
}

buttonUp.addEventListener("click", function(event){
    window.navigator.vibrate(50);
    dataChannel.send("u");
});

buttonDown.addEventListener("click", function(event){
    window.navigator.vibrate(50);
    dataChannel.send("d");
});

buttonRight.addEventListener("click", function(event){
    window.navigator.vibrate(50);
    dataChannel.send("r");
});

buttonLeft.addEventListener("click", function(event){
    window.navigator.vibrate(50);
    dataChannel.send("l");
});

