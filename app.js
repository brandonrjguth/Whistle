
//INITIAL SETUP

//Initiate Variables
    let usersBuffered = [];
    let users = [];
    let numberOfClients; 
    let newlength;
    let oldestUser
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




//ON CONNECT
io.on('connection', (socket) => {


    //if socket is defined, create a user in the user array with the id
    if (socket.id !== undefined){
    users.push({id:socket.id});
    }

    //find the timestamp and sync to first user to join
     

    //Set number of clients, and oldest user variables using the io.clients function
    io.clients((error, clients) => {
    oldestUser = clients[0];
    numberOfClients = clients.length;
    });
    

    console.log('users connected :' + numberOfClients);


   
    

    //When you receive page ready from a user
    socket.on('pageReady', () => {

        

       //set variable readyUser equal to the index of the user array containing the same id
       let readyUser =  users.findIndex((user => user.id == socket.id))
       console.log('this users page is ready: ' + readyUser);

       //add pageReady attribute to that user and set equal to true
       users[readyUser].pageReady = true;

        //if more than one client is connected
        if (numberOfClients > 1){
        //sync to oldest client ie: host
        io.to(oldestUser).emit("newUserSync", socket.id);
         }
    });
    

    
    
    //ON DISCONNECT
    socket.on('disconnect', () => {

            
        io.clients((error, clients) => {
    
            //create variable equal to length of IO's returned clients array.
            newlength = clients.length;
            });
            
            //Console log new amount of users
            console.log('disconnect, now their are :' + (newlength));


        //REMOVE NEW USER FROM ARRAY
        for (i=0; i < users.length; i++) {
            if (users[i].id == socket.id) {
                users.splice(i, 1);
                console.log('user disconnected');
            } 
        };
        
        
    });


    socket.on('globalPlayerType', (globalPlayerType) =>{
        console.log('got to global player');
        console.log(globalPlayerType);
        io.emit('globalPlayerType', globalPlayerType);
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



    //Got signal with information for sync from host.
    socket.on('newUserSync', (videoData) =>{

        //let newSyncingUser variable be equal to the index of the users array containing this ID of the user we are syncing.
        let newSyncingUser = users.findIndex((user => user.id == videoData.id));
        console.log(newSyncingUser);

        //set interval to wait for pageReady
        let pageReady = setInterval(isPageReady, 500)
        function isPageReady(){
            
            //if the user is undefined (This protects against refresh spam)
            if (users[newSyncingUser] !== undefined){

                //if page is ready and variable's been set to true by pageReady message
                if (users[newSyncingUser].pageReady == true){

                        //clear the interval
                        clearInterval(pageReady)

                        //send the newURL
                        io.to(videoData.id).emit("newURL", videoData);
                        
                        //send the commands for syncing and playing the new user
                        io.to(videoData.id).emit("playNewUser", videoData);   
                    }
                }
            }
       
    });



    //When oldest users time(host) has reached the sync point for the new user
    socket.on('timeReached', (videoData) =>{
        console.log('time Reached');
        console.log(videoData);

        //send the time to the user who requested it.
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

        io.clients((error, clients) => {
            numberOfClients = clients.length;
        });
            

        //if socket id isn't undefined. (Helps protect against refresj spam)
        if (socket.id !== undefined){
            //Push users ID to usersBuffered array
            usersBuffered.push(socket.id);
        } 
         
        console.log('im buffered : '+ socket.id)
        console.log('this many users starting buffer ' + usersBuffered.length )
        console.log('this many users on socket ' + users.length )


        //If this is the first user sending buffered signal
        if (usersBuffered.length === 1){
            //make oldest time their time
            oldestTime = userTime;
        }
       
    
        //If all buffered users are here
        if (usersBuffered.length >= numberOfClients){
        
                //Reset usersBuffered array for next buffer
                console.log('ALL BUFFERED');
                usersBuffered = [];
                
                //Send play signal with the oldest users time.
                io.emit("Play", oldestTime);    
          
        }
      
    });

   

    //PAUSE
    socket.on('Pause', () =>{
        io.emit('Pause');
    });


    socket.on('newTime', (client) =>{
        io.emit('newTime', client);
    });

    //RECEIVED CHAT MESSAGE
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
      });




});

//LISTEN PORT
http.listen(3001, "0.0.0.0");