
//INITIAL SETUP

//
    let counter = [];
    let clients = [];
    let oldestTime;


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
const { ClientRequest } = require('http');
const { SSL_OP_NO_TICKET } = require('constants');
 
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
let length; 
let newlength;
let oldestUser



//ON CONNECT
io.on('connection', (socket) => {

    if (socket.id !== undefined){
    users.push({id:socket.id});
    }

    //find the timestamp and sync to first user to join
     

    
    io.clients((error, clients) => {
    oldestUser = clients[0];
    length = clients.length;
    });
    

    console.log('users connected :' + length);


    if (length > 1){
        io.to(oldestUser).emit("newUserSync", socket.id);
    }
    
    socket.on('pageReady', () => {
       let readyUser =  users.findIndex((user => user.id == socket.id))
       console.log('this users page is ready: ' + readyUser);
       users[readyUser].pageReady = true;
    });
    

    
    
    //ON DISCONNECT
    socket.on('disconnect', () => {

            
        io.clients((error, clients) => {
    
            newlength = clients.length;
            });
            
        
            console.log('disconnect, now their are :' + (newlength));

        //REMOVE NEW USER FROM ARRAY
        for (i=0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                users.splice(i, 1);
                console.log('user disconnected');
            } 
        };
        
        
    });



    //RECEIVED A NEW URL
    socket.on('newURL', (newURL) =>{

            //-----------------------------------------       DO A REGEX CHECK ON URL      -------------------------------------------------------------//
        if (newURL.url != undefined || newURL.url != '') {

            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
            var match = newURL.url.match(regExp);

            console.log("Done Reg Check");
            


            //------------------------------------------------------------------------------------------------------------------------------------------//

            //IF YOUTUBE URL, SEND THE NEW URL WITH TYPE YOUTUBE
            if (match && match[2].length == 11) {

                newURL.type = "youtube";
                newURL.url = match[2];
            }

            //ELSE, SEND THE NEW URL WITH TYPE DIRECTLINK
            else {

                newURL.type = "directLink";     
            }

            console.log('This is a ' + newURL.type + ' link');
            console.log('Sending URL : ' + newURL.url);

            //Send new URL to all.
            io.emit('newURL', newURL)
        }
    });



    //FOUND TIME FOR NEW USER, PLAY OR PAUSE ACCORDINGLY
    socket.on('newUserSync', (videoData) =>{
        let newSyncingUser = users.findIndex((user => user.id == videoData.id));
        console.log(newSyncingUser);

        //set interval to wait for pageReady signal

        let pageReady = setInterval(isPageReady, 500)
        function isPageReady(){
            
            if (users[newSyncingUser] !== undefined){
                if (users[newSyncingUser].pageReady == true){
                        clearInterval(pageReady)

                    
                        io.to(videoData.id).emit("newURL", videoData);
                        io.to(videoData.id).emit("playNewUser", videoData);   
                    }
                }
            }
        
    
          
    });

    //When oldest users time as reached the sync point for the new user
    socket.on('timeReached', (videoData) =>{
        console.log('time Reached');
        console.log(videoData);
        io.to(videoData.id).emit('timeReached');
    });


 

  

    //----------------------- CHECK ALL USERS BUFFER ---------------------//



    //REVEIVED CHECK BUFFER MESSAGE
    socket.on('checkBuffer', (newClient) => {
        //Send everyone a check buffer message.
        io.emit('checkBuffer', newClient);
    });
    

    //RECEIVE IM BUFFERED MESSAGE
    socket.on('isBuffered', (userTime) =>{

        

        //TODO: Pushing to counter array is unreliable.
        //Instead, add isBuffered property to users, when all are true, set to false, send signal
        //Basically try to get rid of pushes to arrays on connections cause they can fuck up when refresh gets spammed


        if (socket.id !== undefined){
            //Push users ID to counter array
            counter.push(socket.id);
        } 
         
    
        
        console.log('this many users starting buffer ' + counter.length )
        console.log('this many users on socket ' + users.length )

        //If this is the first user sending buffered signal
        if (counter.length === 1){
            //make oldest time their time
            oldestTime = userTime;
        }
       
        
       
        //If all buffered users are here
        if (counter.length >= length){
        
                //Reset counter array for next buffer
                console.log('ALL BUFFERED');
                counter = [];
                
                //Send play signal with the oldest users time.
                io.emit("Play", oldestTime);    
          
        }
      
    });

   
    //PAUSE
    socket.on('Pause', () =>{
        io.emit('Pause');
    });













    //RECEIVED CHAT MESSAGE
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
      });
});

//LISTEN PORT
http.listen(3001, "0.0.0.0");