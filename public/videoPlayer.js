
    //Declare variable "player" equal to the video player in the users dom.
    let player = $("#video").get(0);

    //--------------------------------- VIDEO PLAYER FUNCTIONS ---------------------------------//


    //PLAY AND PAUSE
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 
    $("#playPause").click(function(){
        if (player.paused == true){
            socket.emit('checkAllUsersBuffer');
        }
        else  {
            socket.emit('Pause');
        }
    });
  
       
    //GO TO TIME//
    //When the seek button is pressed, do the math to calculate the seconds value of the format hh:mm:ss, 
    $("#seek").click(function(){
        if ($("#hour").val() == ""){
            $("#hour").val(0);
        }
        if ($("#minute").val() == ""){
            $("#minute").val(0);
        };
        if ($("#second").val() == ""){
            $("#second").val(0);
        };
        
        //Declare variable "newTime" storing the new time.
        let newTime = parseInt(($("#hour").val()) * 60 * 60) + (parseInt($("#minute").val()) * 60) + parseInt($("#second").val());

        //Send signal to socket "newTime", syncing all users to the timestamp.
        //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 
        socket.emit("newTime", newTime);
        if(player.paused === true){
            socket.emit("Pause");
        } else if (player.paused === false){
            socket.emit("checkAllUsersBuffer");
        }  
    });


    //SHOW OR HIDE THE GO TO TIME FORM//
    $("#showSeekCommands").click(function(){
        if ($("#seekCommands").hasClass("hidden") == true){
            $("#seekCommands").removeClass("hidden");
            $("#showSeekCommands").text("Hide Controls");
        }
        else {
            $("#seekCommands").addClass("hidden");
            $("#showSeekCommands").text("Go To Time");
        }
        ;  
    });


    //SKIP BUTTONS//
    //Calculates current timestamp and sets the video's current time to the timestamp plus 10 seconds.
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    //SKIP AHEAD
    $("#skipAhead").click(function(){
        let currentTime = player.currentTime;
        newTime = currentTime + 10;
        socket.emit("newTime", newTime);
        if(player.paused === true){
                socket.emit("Pause");
            } else if (player.paused === false){
                socket.emit("Pause");
                socket.emit("checkAllUsersBuffer");
            }
    });

    //SKIP BACK
    $("#skipBack").click(function(){
        let currentTime = player.currentTime;
        newTime = currentTime - 10;
        socket.emit("newTime", newTime);
        if(player.paused === true){
                socket.emit("Pause");
            } else if (player.paused === false){
                socket.emit("Pause");
                socket.emit("checkAllUsersBuffer");
            }
    });

    //NEW URL BUTTON
    //When the submit url button is clicked, check the input text of the new url field and make it equal to a new variable newURL.
    //send signal to "newURL" socket with the newURL which will sync all users with the new url.

    $("#urlSubmit").click(function(){
        let newURL = $("#urlInputText").val();
        socket.emit('newURL', newURL);   
    });

    //FULLSCREEN BUTTON
    let playerStyle = player.style;
    
    $("#fullScreen").click(function(){
        //document.getElementById("videoArea").requestFullscreen();
        player.height = "1000px";
        player.width = "1000px";
    });
   

//---------------------------------------------- SOCKET.IO FUNCTIONS ---------------------------------//

    $(function () {
        //DEFAULT SOCKET.IO MESSAGE FUNCTION
        $('form').submit(function(e){
            e.preventDefault(); // prevents page reloading
            socket.emit('chat message', $('#m').val());
            $('#m').val('');
            return false;
        });


        //--------------------------------------SOCKET RECEIVES--------------------------------------//
        
        //CHECK IF USER IS BUFFERED
        //Runs an interval that checks the readystate of the video player every half second.
        //Once the player has reached readystate 4 (Buffered enough to play), send signal 
        //to "isBuffered" socket.

        socket.on("checkAllUsersBuffer", () =>{
            console.log("received check buffered");
            socket.emit("Pause");
            let checkBufferedUser = setInterval(function(){
                console.log("checking buffer");
            if (player.readyState == 4){
                console.log("buffered");
                socket.emit('isBuffered');
                clearInterval(checkBufferedUser);
            }
                
            },500);
        });

        //FIND TIME
        //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket. 
        socket.on("newUserSync", () => {
           let playerInfo = {time:player.currentTime, src: $('#video').attr("src"), paused:player.paused};
           socket.emit("newUserSync", playerInfo);
        });

        //CHAT MESSAGE
        //Append the recevied message to an unordered list.
        socket.on('chat message', (msg) => {
            $('#messages').append($('<li>').text(msg));
        });

        //NEW URL
        //Change the URL to the received URL.
        socket.on('newURL', (newURL) => {
            $('#video').attr("src", newURL);
        });
        //NEW TIME
        //Change the time to the received time.
        socket.on('newTime', (newTime) => {
            player.currentTime = newTime;
        });

        //PLAY/PAUSE
        //Play or pause the local player.
        socket.on('Pause', () => {
            player.pause();
        });
        socket.on('Play', () => { 
            player.play();
        });
        
});


