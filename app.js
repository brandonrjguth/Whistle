
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





//ON CONNECT
io.on('connection', (socket) => {
    users.push({id:socket.id});

    //find the timestamp and sync to first user to join
    let oldestUser = users[0].id;

    if (users.length > 1){
        io.to(oldestUser).emit("newUserSync");
    }
    
    
    

    

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
    socket.on('newUserSync', (newURL) =>{
    

    });


    //FOUND TIME ALL USERS, SYNC ALL USERS
    socket.on('newTime', (newTime) =>{
    });

    



  
    socket.on('findTime', (newTime) => {

        
    });

  

    //----------------------- CHECK ALL USERS BUFFER ---------------------//


    socket.on("checkReady", () =>{

 
    });


    //REVEIVED CHECK BUFFER MESSAGE
    socket.on('checkBuffer', () => {
        //Send everyone a check buffer message.
        io.emit('checkBuffer');
    });
    

    //RECEIVE IM BUFFERED MESSAGE
    socket.on('isBuffered', (userTime) =>{

        
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
        if (counter.length === users.length){
        
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