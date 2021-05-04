var connection = new WebSocket('ws://' + window.location.hostname + ':9090'); 

var padContainer = document.getElementById('dpad-container');
var buttonPlay = document.getElementById('btnPlay');
var buttonUp = document.getElementById('btnUp'); 
var buttonDown = document.getElementById('btnDown'); 
var buttonRight = document.getElementById('btnRight'); 
var buttonLeft = document.getElementById('btnLeft');

var rtcConnection, dataChannel;
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
	    // ice server is only needed when player is not in the same network
            //"iceServers": [{ "urls": "stun:stun.1.google.com:19302" }] 
        }; 
		
        rtcConnection = new RTCPeerConnection(configuration);
        openDataChannel();

        //setup ice handling
        //when the browser finds an ice candidate we send it to another peer 
        rtcConnection.onicecandidate = function (event) {
            if (event.candidate) { 
                send({ 
                    type: "candidate", 
                    candidate: event.candidate 
                }); 
            } 
        };

        rtcConnection.ondatachannel = function (event) {
            dataChannel = event.channel;
            dataChannel.onerror = function (error) { 
                console.log("Error:", error); 
            };
        };

        //make an offer
        var offer = await rtcConnection.createOffer();
        await rtcConnection.setLocalDescription(offer);
        send({type: "offer", offer: rtcConnection.localDescription});
    }
};

//when another user answers to our offer 
function onAnswer(answer) {
    rtcConnection.setRemoteDescription(new RTCSessionDescription(answer));

    for (var i=0; i<cands.length; i++) {
        rtcConnection.addIceCandidate(cands[i]);
    }
}

//when we got ice candidate from another user 
function onCandidate(candidate) {
    if (!rtcConnection.setRemoteDescription) {
        cands.push(candidate);
    } else {
        rtcConnection.addIceCandidate(candidate);
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
    
    dataChannel = rtcConnection.createDataChannel("myDataChannel", dataChannelOptions);
    dataChannel.onerror = function (error) { 
        console.log("Error:", error); 
    };
}

buttonUp.addEventListener("click", function(event){
    dataChannel.send("u");
    try {
        window.navigator.vibrate(50);
    }
    catch (e) {}
});

buttonDown.addEventListener("click", function(event){
    dataChannel.send("d");
    try {
        window.navigator.vibrate(50);
    }
    catch (e) {}
});

buttonRight.addEventListener("click", function(event){
    dataChannel.send("r");
    try {
        window.navigator.vibrate(50);
    }
    catch (e) {}
});

buttonLeft.addEventListener("click", function(event){
    dataChannel.send("l");
    try {
        window.navigator.vibrate(50);
    }
    catch (e) {}
});
