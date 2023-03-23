
//INITIAL SETUP

//Requires (Body Parser, EJS, Express, Mongo, Mongoose)
    const bodyParser = require('body-parser');
    const ejs = require("ejs");
    const express = require("express");
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


const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'test';
 
// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
 
  const db = client.db(dbName);
 
  client.close();
});


/*---------------------------------------------ROUTES-------------------------------------------------------*/

app.get('/', function(req, res) {
    res.render('streamVideo');
});

/*------------------------------------------IO CONTROLS------------------------------------------------------*/
let users = [];
let counter = [];
let counter2 = [];

//ON CONNECT
io.on('connection', (socket) => {
    //push users to user array.
    users.push({id:socket.id});

    //ON DISCONNECT
    socket.on('disconnect', () => {
        //REMOVE NEW USER FROM ARRAY
        for (i=0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                users.splice(i, 1);
            } 
        };
    });


    //When new user joins chat and has interacted with DOM, or sync button is pressed;
    socket.on('sync', () => {
        //find the timestamp and sync to first user to join
        let oldestUser = users[0].id;
        io.to(oldestUser).emit("newUserSync");
    })

    //FOUND TIME FOR NEW USER, PLAY OR PAUSE ACCORDINGLY
        socket.on('newUserSync', (newURL) =>{
        let newestUser = users[users.length - 1].id;
        newURL.isNewUser = true;
        io.sockets.connected[newestUser].emit("newURL", newURL);

        if(newURL.type === "youtube"){
        } else{
            io.emit("newTime", newURL.time);
            if (newURL.playerState === true){
                io.sockets.connected[newestUser].emit("Pause");
            } else {
                io.emit("Pause");
                io.emit("checkAllUsersBuffer", newURL.time);
            }
        }
    });

    //FOUND TIME ALL USERS, SYNC ALL USERS
    socket.on('newTime', (newTime) =>{
        if (newTime < 0 || newTime === undefined){
            newTime = 0;
        }
        io.emit("newTime", newTime);
    });

    //RECEIVED A NEW URL
    socket.on('newURL', (newURL) =>{
                //DO A REGEX CHECK ON URL
                if (newURL.urlID != undefined || newURL.urlID != '') {
                    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
                    var match = newURL.urlID.match(regExp);
                    //IF YOUTUBE URL, SEND THE NEW URL WITH TYPE YOUTUBE
                    if (match && match[2].length == 11) {
                        newURL.type = "youtube";
                        newURL.urlID = match[2];
                        newURL.url = match[0];
                        io.emit('newURL', newURL);
                    }
                    //ELSE, SEND THE NEW URL WITH TYPE DIRECTLINK
                    else {
                        newURL.type = "directLink";
                        io.emit('newURL', newURL);
                    }
                }
    });

    //CHECK BUFFER STATUS ON SERVER WHICH GETS SENT BACK AS IS BUFFERED
    socket.on('checkAllUsersBuffer', (clickedTime) => {
        io.emit('checkAllUsersBuffer', clickedTime);
    });

    socket.on('sendCheckAllUsersBuffer', () => {

        console.log("got here");
        counter2.push(1);    
        if (counter2.length >= users.length){
            counter2 = [];
                //WAIT TIME TO HELP SLIGHT EXTRA BUFFER
                setTimeout(function(){
                    io.emit("checkAllUsersBuffer");    
            }, 400);        
        }
    });

    //RECEIVE BUFFERED FROM ALL CLIENTS AND PLAY IF TRUE.
    socket.on('isBuffered', (clickedTime) =>{

        console.log("received is buffered");
        counter.push(1);    
        if (counter.length >= users.length){
            counter = [];
                //WAIT TIME TO HELP SLIGHT EXTRA BUFFER
                setTimeout(function(){
                    io.emit("Play", clickedTime);    
            }, 400);
                
        }
    });

    socket.on('YTPlay', (time) => {
        io.emit('Play', time);
    })
    
    socket.on('Pause', () =>{
        io.emit('Pause');
    });
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
      });
});

//LISTEN PORT
http.listen(3001, "0.0.0.0");