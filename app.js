
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



//ROUTES

app.get('/', function(req, res) {
    res.render('streamVideo');
});

app.post('/testButton', function(req, res) {
    console.log(req.body.input);

});


//IO CONTROLS
let users = [];



//ON CONNECT
io.on('connection', (socket) => {
    users.push({id:socket.id, isBuffered:false});
    console.log([users[0].id]);
    console.log([users]);
    io.to(users[0].id).emit("findTime");
    

    //TO-DO: ADD LOGIC THAT CHECKS IF OTHER PLAYERS ARE PAUSED, AND PAUSES.
    

    //ADD NEW USER TO ARRAY
   
   
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


    //FOUND TIME NEW USER
       socket.on('foundTime', (timeAndSource) =>{
        io.sockets.connected[users[users.length - 1].id].emit("newURL", timeAndSource.src);
        io.emit("newTime", timeAndSource.time);
        if(timeAndSource.isPaused === true){
            io.sockets.connected[users[users.length - 1].id].emit("Pause");
        } else {
            io.emit("Pause");
            setTimeout(function(){io.emit("checkBufferedUsers");}, 4000);
        };
    });

    //FOUND TIME ALL USERS
    socket.on('allFoundTime', (timeAndSource) =>{
        if (timeAndSource.time < 0){
            timeAndSource.time = 0;
        }
        //io.emit("newURL", timeAndSource.src);
        io.emit("newTime", timeAndSource.time);
        
    });


    //NEW URL
    socket.on('newURL', (newURL) =>{
        io.emit('newURL', newURL);
    });

    //CHECK BUFFER AND PLAY
    socket.on('checkBufferedUsers', () => {
        io.emit('checkBufferedUsers');
    });

    //IS BUFFERED
    socket.on('isBuffered', (buffered) =>{
        
        for (i=0; i < users.length; i++){
            if (users[i].id === buffered.id){
                users[i].isBuffered = true;
            }
        };

        let evaluateBuffer = (arrayvalue) => arrayvalue.isBuffered == true;
        let evaluateBufferAll = () => {
            if (users.every(evaluateBuffer) == true){
                setTimeout(function() {io.emit("Play")}, 3000);
            } else setTimeout(evaluateBufferAll, 1000);
        };
        
       evaluateBufferAll();
    
    });
       
            

    //PAUSE
    socket.on('Pause', () =>{
        io.emit('Pause');
    });




    socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
    });
});


http.listen(3000, "0.0.0.0");