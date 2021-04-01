!#/bin/bash

ngrok http -region eu 9090 > /dev/null &
URL=$(curl http://localhost:4040/api/tunnels -s | jq ".tunnels[1].public_url" -r)

