
//INITIAL SETUP

//Requires (Body Parser, EJS, Express, Mongo, Mongoose)
    const bodyParser = require('body-parser');
    const ejs = require("ejs");
    const express = require("express");
    const app = express();
    const http = require('http');
    const server = http.createServer(app);

    //For Heroku
    //const io = require('socket.io')(server, {
      //transports: ['websocket'],
    //});

    //For Local
    const io = require('socket.io')(server);

    const cors = require('cors');
    app.use(cors());
    const httpCheck = require('http');
    const httpsCheck = require('https');

    //Set port express will listen on.
    const port = 3000;

//OTHER
    //Configure Body Parser and EJS
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname + '/public'));

/*---------------------------------------------ROUTES-------------------------------------------------------*/

app.get('/', function(req, res) {
    res.render('streamVideo');
});

/*------------------------------------------IO CONTROLS------------------------------------------------------*/
let bufferedCounters = new Map();
let newURLCounters = new Map();

//ON CONNECT
io.on('connection', (socket) => {     

    //ON DISCONNECT
    socket.on('disconnect', () => {

    });

    //When new user joins chat and has interacted with DOM, or sync button is pressed;
    socket.on('sync', (roomID) => {

        if (!newURLCounters.get(roomID)){
            newURLCounters.set(roomID, 0);
        }

        if (!bufferedCounters.get(roomID)){
            bufferedCounters.set(roomID, 0);
        }

        socket.join(roomID);
        const roomSockets = io.sockets.adapter.rooms.get(roomID);
        let socketsArray = [...roomSockets];
    
        // If the room is empty or doesn't exist, create/join the room
        if (socketsArray.length > 1) {
            
            //find the timestamp and sync to first user to join
            let oldestUser = socketsArray[0].toString();
            console.log('room = '+roomID);
            io.to(socketsArray[0]).emit("newUserSync", roomID);
        } else {
            // Otherwise, join the existing room
            socket.join(roomID);
        }
    })

    //FOUND TIME FOR NEW USER, PLAY OR PAUSE ACCORDINGLY
        socket.on('newUserSync', (oldUser) =>{

        const roomSockets = io.sockets.adapter.rooms.get(oldUser.roomID);
        let socketsArray = [...roomSockets];
        let newestUser = socketsArray[socketsArray.length - 1];
        oldUser.newURL.isNewUser = true;

        io.to(newestUser).emit("newURL", oldUser.newURL);

        if(oldUser.newURL.type === "youtube"){
        } else{
            io.emit("newTime", oldUser.newURL.time);
            if (oldUser.newURL.playerState === true){
                io.to(newestUser).emit("Pause");
            } else {
                io.emit("Pause");
                io.to(oldUser.roomID).emit("checkAllUsersBuffer", oldUser.newURL.time);
            }
        }
    });

    //FOUND TIME ALL USERS, SYNC ALL USERS
    socket.on('newTime', (fromUser) =>{
        if (fromUser.time < 0 || fromUser.time === undefined){
            fromUser.time = 0;
        }
        io.to(fromUser.roomID).emit("newTime", fromUser.time);
    });

    //RECEIVED A NEW URL
    socket.on('newURL', (newURL) =>{

                //DO A REGEX CHECK ON URL
                if (newURL.urlID != undefined || newURL.urlID != '') {
                    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
                    let match = newURL.urlID.match(regExp);
                    //IF YOUTUBE URL, SEND THE NEW URL WITH TYPE YOUTUBE
                    if (match && match[2].length == 11) {
                        newURL.type = "youtube";
                        newURL.urlID = match[2];
                        newURL.url = match[0];

                        //regCheck for http, or https
                        let regExp = /(?:((?:https|http):\/\/)|(?:\/))/;

                        //check if link is valid before sending
                        if (match){
                            try {
                                if (newURL.url.startsWith('https')) {
                                  const request = httpsCheck.get(newURL.url, (response) => {
                                    if (response.statusCode === 200) {
                                      console.log('sending new https url');
                                      io.to(newURL.roomID).emit('newURL', newURL);
                                    }
                                  });
                              
                                  request.on('error', (error) => {
                                    console.error(`Error making HTTPS request: ${error.message}`);
                                  });
                                } else {
                                  const request = httpCheck.get(newURL.url, (response) => {
                                    if (response.statusCode === 200) {
                                      console.log('sending new http url');
                                      io.to(newURL.roomID).emit('newURL', newURL);
                                    }
                                  });
                              
                                  request.on('error', (error) => {
                                    console.error(`Error making HTTP request: ${error.message}`);
                                  });
                                }
                              } catch (error) {
                                console.error(`Error checking URL: ${error.message}`);
                              }
                        }
                    }

                    //ELSE, SEND THE NEW URL WITH TYPE DIRECTLINK
                    else {

                        //regCheck for starts with https, or http, ends with valid video type;
                        let regExp = /(?:((?:https|http):\/\/)|(?:\/)).+(?:.webm|mp4|ogg)/;
                        let match = newURL.urlID.match(regExp);
                        newURL.type = "directLink";
                        
                        //user the https, and http node modules respectively to see if the
                        //link is valid and active, if so, send to user
                        if (match){
                            try {
                                if (newURL.urlID.startsWith('https')) {
                                  const request = httpsCheck.get(newURL.urlID, (response) => {
                                    if (response.statusCode === 200) {
                                      console.log('sending new https url');
                                      io.to(newURL.roomID).emit('newURL', newURL);
                                    }
                                  });
                              
                                  request.on('error', (error) => {
                                    console.error(`Error making HTTPS request: ${error.message}`);
                                  });
                                } else {
                                  const request = httpCheck.get(newURL.urlID, (response) => {
                                    if (response.statusCode === 200) {
                                      console.log('sending new http url');
                                      io.to(newURL.roomID).emit('newURL', newURL);
                                    }
                                  });
                              
                                  request.on('error', (error) => {
                                    console.error(`Error making HTTP request: ${error.message}`);
                                  });
                                }
                              } catch (error) {
                                console.error(`Error checking URL: ${error.message}`);
                              }
                        }
                    }
                }
    });

    //Check if all users have newURL and players are ready
    socket.on('newURLReady', (fromUser) => {
        console.log("newURLReady received")
        newURLCounters.set(fromUser.roomID, newURLCounters.get(fromUser.roomID) + 1);
        console.log('newURL Counter = '+ newURLCounters.get(fromUser.roomID))
        const clients = io.sockets.adapter.rooms.get(fromUser.roomID); // Get the clients in the room
        const numClients = clients ? clients.size : 0; // Get the number of clients in the room

        if (newURLCounters.get(fromUser.roomID)>= numClients) {
            // All clients are buffered, send "play" event to the room and clear the counter
            setTimeout(function(){
                io.to(fromUser.roomID).emit("checkAllUsersBuffer", fromUser.time);    
            }, 400);
            newURLCounters.set(fromUser.roomID, 0);
        }
    });

    //CHECK BUFFER STATUS ON SERVER WHICH GETS SENT BACK AS IS BUFFERED
    socket.on('checkAllUsersBuffer', (fromUser) => {
        io.to(fromUser.roomID).emit('checkAllUsersBuffer', fromUser.time);
    });


    //RECEIVE BUFFERED FROM ALL CLIENTS AND PLAY IF TRUE.
    socket.on('isBuffered', (fromUser) =>{
        bufferedCounters.set(fromUser.roomID, bufferedCounters.get(fromUser.roomID) + 1);

        const clients = io.sockets.adapter.rooms.get(fromUser.roomID); // Get the clients in the room
        const numClients = clients ? clients.size : 0; // Get the number of clients in the room

        if (bufferedCounters.get(fromUser.roomID)>= numClients) {
            
          let currentTimeInMilliseconds = Date.now();
          let targetPlayTime = currentTimeInMilliseconds + 5000;
            setTimeout(function(){;
                io.to(fromUser.roomID).emit("Play", {time:fromUser.time, roomID:fromUser.roomID, targetPlayTime:targetPlayTime});    
            }, 400);
            bufferedCounters.set(fromUser.roomID, 0);
        }
    });

    socket.on('Pause', (roomID) =>{
        io.to(roomID).emit('Pause');
    });
    
    socket.on('chat message', (fromUser) => {
        io.to(fromUser.roomID).emit('chat message', fromUser);
      });
});

//LISTEN PORT
server.listen(process.env.PORT || 3000);
