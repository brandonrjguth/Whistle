
//INITIAL SETUP

//Requires (Body Parser, EJS, Express, Mongo, Mongoose)
    const bodyParser = require('body-parser');
    const ejs = require("ejs");
    const express = require("express");
    const { MongoClient } = require("mongodb");
    const mongoose = require('mongoose');
    const app = express();
    const http = require('http').createServer(app);
    const io = require('socket.io')(http);
//SET EXPRESS AND MONGO CONNECTION PORT AND URL.
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

app.post('/testButton', function(req, res) {
    console.log(req.body.input);

});

/*------------------------------------------IO CONTROLS------------------------------------------------------*/
let users = [];
let counter = [];




//ON CONNECT
io.on('connection', (socket) => {

    //push users to user array.
    users.push({id:socket.id});
    //find the timestamp and sync to first user to join
    let oldestUser = users[0].id;
    io.to(oldestUser).emit("newUserSync");
    
    

    //TO-DO: ADD LOGIC THAT CHECKS IF OTHER PLAYERS ARE PAUSED, AND PAUSES.
    

    //ON DISCONNECT
    socket.on('disconnect', () => {

        //REMOVE NEW USER FROM ARRAY
        for (i=0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                users.splice(i, 1);
                console.log('user disconnected');
            }
        };
        
        
    });

    //FOUND TIME FOR NEW USER, PLAY OR PAUSE ACCORDINGLY
       socket.on('newUserSync', (playerInfo) =>{
        let newestUser = users[users.length - 1].id;
        io.sockets.connected[newestUser].emit("newURL", playerInfo.src);
        io.emit("newTime", playerInfo.time);

        if(playerInfo.paused === true){
            io.sockets.connected[newestUser].emit("Pause");
        } else {
            io.emit("Pause");
            io.emit("checkAllUsersBuffer");
        };
    });

    //FOUND TIME ALL USERS, SYNC ALL USERS
    socket.on('newTime', (newTime) =>{
        if (newTime < 0){
            newTime = 0;
        }
        io.emit("newTime", newTime);
    });

    //NEW URL
    socket.on('newURL', (newURL) =>{
        io.emit('newURL', newURL);
    });

    //CHECK BUFFER STATUS ON SERVER WHICH GETS SENT BACK AS IS BUFFERED
    socket.on('checkAllUsersBuffer', () => {
        io.emit('checkAllUsersBuffer');
    });

    //RECEIVE BUFFERED FROM ALL CLIENTS AND PLAY IF TRUE.
    socket.on('isBuffered', () =>{
        counter.push(1);    
        if (counter.length == users.length){
                //WAIT TIME TO HELP SLIGHT EXTRA BUFFER
                setTimeout(function(){io.emit("Play");}, 1800);
                counter = [];
        }
    });
       
    //PAUSE
    socket.on('Pause', () =>{
        io.emit('Pause');
    });

    //RECEIVED CHAT MESSAGE
    socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
    });
});

//LISTEN PORT
http.listen(3000, "0.0.0.0");