//TODO: 

//const { NONAME } = require("dns");

    //Declare variable "player" equal to the video player in the users dom.
    let player = $("#video").get(0);
    let globalPlayerType = "directLink";
    let YTPlayer;
    let lastState;
    let lastStateArray = [];
    let gotNewUser = true;
    let isNewURL = false;
    

    //--------------------------------- VIDEO PLAYER FUNCTIONS ---------------------------------//


    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    
    $("#playPause").click(function(){


        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            if (YTPlayer.getPlayerState() == 2 || YTPlayer.getPlayerState() == 5 || YTPlayer.getPlayerState() == 0){

                socket.emit('checkAllUsersBuffer');

            }

            else  {

                socket.emit('Pause');

            }

        }

        //IF DIRECTLINK
        if (globalPlayerType === "directLink"){

            if (player.paused == true){

                socket.emit('checkAllUsersBuffer');

            } else{

                socket.emit('Pause');

            }

        }   
    });
  
    //--------------------- GO TO TIME ---------------------//

    //Button to hide or show time button
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


        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            if(YTPlayer.getPlayerState() === 2){
                
                socket.emit("Pause");

            } else {

                socket.emit("YTPlay", newTime);

            }  

        //IF DIRECT LINK
        } else {

            if(player.paused === true){

                socket.emit("Pause");

            } else if (player.paused === false){

                socket.emit("checkAllUsersBuffer");

            }  
        }

       
    });


    //--------------------- SKIP BUTTONS ---------------------//

    //Calculates current timestamp and sets the video's current time to the timestamp plus 10 seconds.
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    //----------- SKIP AHEAD -----------//
    $("#skipAhead").click(function(){

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            let currentTime = YTPlayer.getCurrentTime();
            newTime = currentTime + 10;
            socket.emit("newTime", newTime);

            if(YTPlayer.getPlayerState() === 2){

                socket.emit("Pause");

            } else {

                socket.emit("YTPlay", newTime);

            }  

        //IF DIRECTLINK
        } else {

            let currentTime = player.currentTime;
            newTime = currentTime + 10;
            socket.emit("newTime", newTime);

            if(player.paused === true){

                socket.emit("Pause");

            } else if (player.paused === false){

                socket.emit("checkAllUsersBuffer");

            }  
        }
    });


    //----------- SKIP BACK -----------//
    $("#skipBack").click(function(){

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            let currentTime = YTPlayer.getCurrentTime();
            newTime = currentTime - 10;
            socket.emit("newTime", newTime);

            if(YTPlayer.getPlayerState() === 2){

                socket.emit("Pause");

            } else {

                socket.emit("YTPlay", newTime);

            }
            
        //IF DIRECT LINK
        } else {

            let currentTime = player.currentTime;
            newTime = currentTime - 10;
            socket.emit("newTime", newTime);

            if(player.paused === true){

                socket.emit("Pause");

            } else if (player.paused === false){

                socket.emit("checkAllUsersBuffer");

            }  
        }
    });


    //--------------------- NEW URL BUTTON ---------------------/

    //When the submit url button is clicked, check the input text of the new url field and make it equal to a new variable newURL.
    //send signal to "newURL" socket with the newURL which will sync all users with the new url.
    $("#urlSubmit").click(function(){
        console.log("URL submitted");
        let newURL = ({urlID:$("#urlInputText").val()});
        socket.emit('newURL', newURL);   
    });

    //FULLSCREEN BUTTON TO DO//
   

//----------------------------------------------------- SOCKET.IO FUNCTIONS -----------------------------------------------------------//

    $(function () {
        //DEFAULT SOCKET.IO MESSAGE FUNCTION
        $('form').submit(function(e){
            e.preventDefault(); // prevents page reloading
            socket.emit('chat message', $('#m').val());
            $('#m').val('');
            return false;
        });


      
    //---------------------  NEW URL ---------------------//

    //(MUST BE FIRST BECAUSE THIS IS WHEN YOUTUBE API BECOMES SUBSTANTIATED)
    //Change the URL to the received URL.

    let regexedYoutubeURL

    socket.on('newURL', (newURL) => {
        isNewURL = true;
        console.log("received URL from server");
        console.log("URL Type : " + globalPlayerType);
        
        //IF YOUTUBE
        if (newURL.type == "youtube"){

                regexedYoutubeURL = newURL.urlID;
                
                //AND YOUTUBE PLAYER IS UP
                if (globalPlayerType === "youtube"){

                    //CHANGE THE SOURCE
                    console.log("here");
                    $("#YTPlayer").remove();
                    $("#embeddedArea").append("<video id=\"YTPlayer\" style=\"display:block\"></video>");
                    

                //IF OTHER PLAYER IS UP
                } 
                    
                //STARTUP YOUTUBE API
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                
                //CREATE NEW YOUTUBE IFRAME
                //Do math here later to calculate rem sizing

                setTimeout(function(){

                    player.pause();
                    player.removeAttribute('src'); // empty source
                    player.load();
                    $("#video").remove();

                    YTPlayer = new YT.Player('YTPlayer', {
                    height: 500,
                    width: 300,
                    playerVars: {'autoplay': 1, 'controls': 0},
                    events: {
                        //'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                         
                        },
                    videoId: regexedYoutubeURL
                   

                    

                });

                setTimeout(function(){YTPlayer.pauseVideo();}, 1500)

                //Stop hiding and display div containing newly generated youtube iframe.
                $("#YTPlayer").css("display", "block");

                //Set the global variable for player type to youtube.
                globalPlayerType = "youtube";


                if (newURL.time === undefined){

                    newURL.time = 0;
                }

                if (newURL.playerState == 2 || newURL.playerState == -1){
                    console.log("here");
                    //setTimeout(function(){socket.emit("Pause")}, 2100);
                    
                }
                setTimeout(function(){

                    if (newURL.playerState == 2){
                        YTPlayer.seekTo(newURL.time);
                        YTPlayer.pauseVideo();

                    }

                    YTPlayer.seekTo(newURL.time);

                }, 2000)
                },1500);
                
                
                
                function onPlayerStateChange(event){

                    if (event.data === YT.PlayerState.CUED){
                        console.log("YT.PlayerState.CUED");
                    }

                    if (event.data === YT.PlayerState.ENDED){
                        console.log("YT.PlayerState.ENDED");
                    }
                    if (event.data === YT.PlayerState.PLAYING){
                        console.log("YT.PlayerState.PLAYING");
                    }
                    if (event.data === YT.PlayerState.PAUSED){
                        console.log("YT.PlayerState.PAUSED");
                    }
                    if (event.data === YT.PlayerState.BUFFERING){
                        console.log("YT.PlayerState.BUFFERING");
                    }
                   
                    

                    if (event.data === YT.PlayerState.PLAYING && lastState === YT.PlayerState.PAUSED){

                        socket.emit("YTPlay", YTPlayer.getCurrentTime());
                        lastStateArray = [];

                    }

                    if (event.data === YT.PlayerState.PAUSED && lastState === YT.PlayerState.PLAYING){

                        lastStateArray.push(event.data);
                        setTimeout(() => {socket.emit("Pause")}, 300)
                        

                    }
                    /*
                    if (event.data === YT.PlayerState.PLAYING && lastState === YT.PlayerState.BUFFERING && gotNewUser == true){ 
                        socket.emit("YTPlay", YTPlayer.getCurrentTime());
                        gotNewUser = false;
                        setTimeout(() => {gotNewUser = true;}, 2000)
                    }

                    if (isNewURL == true && event.data === YT.PlayerState.PLAYING ){ 
                        socket.emit("YTPlay",  YTPlayer.getCurrentTime());
                        //socket.emit("Pause");
                        console.log("here");
                        isNewURL = false;
                    }*/

                    if (event.data === YT.PlayerState.BUFFERING && lastState === YT.PlayerState.BUFFERING){
            
                    }

                    lastState = event.data;

                }       
            

        //IF NEW TYPE IS NOT A YOUTUBE LINK
        } else {

            //IF CURRENT PLAYER IS YOUTUBE
            if (globalPlayerType === "youtube"){
                
                //HIDE YOUTUBE PLAYER AND SHOW MP4 PLAYER, CHANGE URL, ADD DIV TO BE CHANGED BACK TO YOUTUBE IFRAME IF CALLED AGAIN
                $("#YTPlayer").remove();
                $("#embeddedArea").append("<video src=\"\" id=\"video\"></video>");
                $("#video").after("<video id=\"YTPlayer\" style=\"display:none\"></video>");
                $("#video").css("display", "block");
                $("#video").attr("src", newURL.urlID);
                player = $("#video").get(0);

                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                globalPlayerType = "directLink";

            } else {

                //CHANGE URL
                $("#video").attr("src", newURL.urlID);
                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                globalPlayerType = "directLink";

            }
        }
    });
    
        

    //--------------------------- FIND TIME ---------------------------//

    //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket. 

    socket.on("newUserSync", () => {
            
        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

                let newURL = {time:YTPlayer.getCurrentTime(), urlID:regexedYoutubeURL, playerState:YTPlayer.getPlayerState(), type:"youtube"};
                socket.emit("newUserSync", newURL);

        //IF DIRECT LINK
        } else {

            
            let newURL = {time:player.currentTime, urlID: $('#video').attr("src"), playerState:player.paused, type:"directLink"};
            socket.emit("newUserSync", newURL);
            
    }
    });

    
     //--------------------------- NEW TIME ---------------------------//

    //Change the time to the received time.

    socket.on('newTime', (newTime) => {

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            YTPlayer.seekTo(newTime);

        //IF DIRECT LINK
        } else {

            player.currentTime = newTime;
        }
        
        
    });


    //----------------------- CHECK ALL USERS BUFFER ---------------------//
    
    //Runs an interval that checks the readystate of the video player every half second.
    //Once the player has reached readystate 4 (Buffered enough to play), send signal 
    //to "isBuffered" socket.

    socket.on("checkAllUsersBuffer", () =>{

        console.log("received check buffered");

        socket.emit("Pause");

        //SET CHECKING INTERVAL
        let checkBufferedUser = setInterval(function(){

            console.log("checking buffer");
           
            //IF YOUTUBE
            //Look for player state
            if (globalPlayerType === "youtube"){

                if (YTPlayer.getPlayerState() == 5 || YTPlayer.getPlayerState() == 2){

                    console.log("buffered");
                    socket.emit('isBuffered');
                    clearInterval(checkBufferedUser);

                }
            } else {

            //IF DIRECT LINK
            //Look for player state

                if (player.readyState == 4){

                    console.log("buffered");
                    socket.emit('isBuffered');
                    clearInterval(checkBufferedUser);

                }  
            }
        },500);
    });


    //--------------------- PAUSE ---------------------//

    socket.on('Pause', () => {

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            YTPlayer.pauseVideo();

        //IF DIRECT LINK
        } else {
            player.pause();
    }
    });


     //-------------------- PLAY -----------------------//

    socket.on('Play', (time) => { 
        
        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            if (time !== undefined){
            YTPlayer.seekTo(time);

        }
            YTPlayer.playVideo();
        
        //IF DIRECT LINK
        } else {

            player.play();

        }

    });


    //----------------- CHAT MESSAGE ------------------//

    //Append the recevied message to an unordered list.

    socket.on('chat message', (msg) => {

        $('#messages').append($('<li>').text(msg));

    });
    
});