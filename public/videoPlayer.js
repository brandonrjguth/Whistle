//TODO: 

//const { NONAME } = require("dns");

    let player = $("#video").get(0);
    let globalPlayerType = "directLink";
    let YTPlayer;
    let lastState;
    let myUsername;
    let regexedYoutubeURL;
    

    let bufferInProgress = true;

    //STARTUP YOUTUBE API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);



    //--------------------------------- VIDEO PLAYER FUNCTIONS ---------------------------------//

      
    //---------------------  NEW URL ---------------------//

    //(MUST BE FIRST BECAUSE THIS IS WHEN YOUTUBE API BECOMES SUBSTANTIATED)
    //Change the URL to the received URL.


    //IF NEW URL RECIEVED, OR NEW USER RECEIVES URL FROM OTHER CLIENTS
    socket.on('newURL', (newURL) => {
        console.log("received URL from server");
    


        //IF YOUTUBE
        if (newURL.type == "youtube"){

                //change regexed youtubeURL variable to the received urlID from the servers regexer.
                regexedYoutubeURL = newURL.urlID;
                
                //IF YOUTUBE PLAYER IS ALREADY UP
                if (globalPlayerType === "youtube"){

                    //remove the youtube iframe
                    $("#YTPlayer").remove();
                    //create a new div for the new iframe to be inserted into.
                    $("#embeddedArea").append("<video id=\"YTPlayer\" style=\"display:block\"></video>");
                    
                } 
                    


                //-------------------------------------------------------------------------------------------------SET TIMEOUT AND DO THIS IN ALL IN 2 SECONDS FROM NOW --------------------------------------------------------------------------------------------

                setTimeout(function(){


                    //Pause and remove directLink video player
                    player.pause();
                    player.removeAttribute('src'); // empty source
                    player.load();
                    $("#video").remove();
                    
                    //Stop hiding and display div containing newly generated youtube iframe.
                    $("#YTPlayer").css("display", "block");

                    //Set the global variable for player type to youtube.
                    globalPlayerType = "youtube";


                    //Insert transparent overlay on top of Iframe.
                     $('.transparentOverlay').height($('.playerScreen').height());
                     $('.transparentOverlay').width($('.playerScreen').width());

                    //When window it resized, keep transparent div laid over top of the iframe
                    $( window ).resize(() =>{
                        $('.transparentOverlay').height($('.playerScreen').height());
                        $('.transparentOverlay').width($('.playerScreen').width());
                    });


                    
                    //------------------------------------------------------------------------------- DO THIS WHEN THE IFRAME IS READY ---------------------------------------------------------------------------------//

                    //insert a new player
                    window.YT.ready(function() {
        
                        YTPlayer = new YT.Player('YTPlayer', {
                        height: 500,
                        width: 300,
                        playerVars: {'autoplay': 0, 'controls': 0, "disablekb":1, "rel": 1, "modestbranding": 1},
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                            
                            },
                        videoId: regexedYoutubeURL
                        });

                     });

                     
                        
                     //------------------------------------------------------------------------------- DO THIS WHEN THE PLAYER IS READY ---------------------------------------------------------------------------------//


                    function onPlayerReady() {


                        //------------------------------------------------------START UP SEEK BAR ----------------------------------------------//

                        let videotime;
                        //find length of video from YTPlayer and set the seekbars max to that time.
                        videoLength = YTPlayer.getDuration();
                        $(".seekBar").attr("max", videoLength);


                        //Run an interval ever 1/2 second
                        function updateTime() {

                        
                        let oldTime = videotime;

                        //set variable for video's current time to YTPlayers current time.
                        if(YTPlayer && YTPlayer.getCurrentTime()) {
                            videotime = YTPlayer.getCurrentTime();
                        }

                        //if time has changed since last interval, change the seekbar to the new time;
                        if(videotime !== oldTime) {
                            //
                            $(".seekBar").val(videotime);       
                        }


                        //CLEAR INTERVAL IF PLAYERTYPE CHANGES
                        if (globalPlayerType !== "youtube"){
                            clearInterval(timeupdater);
                        }
                        }
                        timeupdater = setInterval(updateTime, 500);
                        //-------------------------------------------------------------------------------------------------------------------//
                        



                        //SEND PLAYER TO TIME RECEIVED FROM OLDEST CLIENT (If alone this will just go to zero and rest of this will be ignored)
                        YTPlayer.seekTo(newURL.time);   
                        
                    




                        //IF OLDEST CLIENT WAS PAUSED
                        if (newURL.playerState == 2 || newURL.playerState == -1){
                        
                            
                            //Start up interval to see if player has buffered and started playing
                            let isPlayerReady = setInterval(checkPlayerReady, 500)

                            function checkPlayerReady(){
                                
                                //If the player is playing, its buffered so pause it and clear the interval.
                                if (YTPlayer.getPlayerState() == 1){
                                    //send signal to pause to all clients again to be sure they are all paused.
                                    socket.emit("Pause");

                                    //Set buffering to false so that play/pause can be detected
                                    bufferInProgress = false;
                                    clearInterval(isPlayerReady);
                                }
                            }
                            


                        //IF OLDEST CLIENT WASN'T PAUSED
                        } else {

                            //DO IN ONE SECOND
                            setTimeout(function(){

                                //Pause
                                socket.emit('Pause');
                                //Send everyone back to the time recieved with the URL
                                socket.emit("newTime", newURL.time);
                                //Check Everyones Buffer
                                socket.emit("checkAllUsersBuffer");         
                            
                            }, 1000)   
                        }
                    }  
                },2000);
                
                
                //---------------------------------------------------------------------------------------------------------------------------------------END OF CODE THAT RUNS IN 2 SCONDS --------------------------------------------------









                //---------------------------------------------------------------- WHEN THE PLAYER EVENT CHANGES --------------------------------------------------//
                function onPlayerStateChange(event){

                    console.log('state change  ' + event.data);


                    //IF play event is fired, paused was last, and bufferInProgress hasn't been triggered
                    if (event.data == 1 && lastState == 2 && bufferInProgress == false){
                    
                        //Check All Users Buffer
                        socket.emit('checkAllUsersBuffer');
                        console.log("buffer in progress = " + bufferInProgress);

                    }

                    //If pause event was fired, and bufferInProgress hasn't been triggered.
                    if (event.data == 2 && bufferInProgress == false){
                       
                        //Pause
                        socket.emit('Pause');

                    }


                    lastState = event.data;

                }       
            
                //--------------------------------------------------------------------








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
                socket.emit("checkAllUsersBuffer");



            } else {

                //CHANGE URL
                $("#video").attr("src", newURL.urlID);
                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                if (newURL.playerState == true){
                    
                    socket.emit("Pause");

                } else {
                    socket.emit("checkAllUsersBuffer");
                }
                globalPlayerType = "directLink";
                

            }
                //STARTUP SEEKBAR LISTENER
                
                let seekBarListener = () => {
                    console.log("here");
                    let videotime
                    videoLength = player.duration;
                    $(".seekBar").attr("max", videoLength);

                    function updateTime(){
                    let oldTime = videotime;
                    if(player && player.currentTime) {
                        videotime = player.currentTime;
                    }
                    if(videotime !== oldTime) {
                        console.log(videotime);
                        console.log(videoLength);
                        $(".seekBar").val(videotime);       
                    }

                    if (globalPlayerType !== "directLink"){
                        clearInterval(timeupdater);
                    }
                    }
                    timeupdater = setInterval(updateTime, 500);
                    }

                    player.onloadedmetadata = function(){
                        seekBarListener();
                    };
                    
        }
    });
    
        






    //--------------------------- FIND TIME ---------------------------//

    //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket. 

    socket.on("newUserSync", () => {
             
            
        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

                console.log("checkin sync");
                let newURL = {time:YTPlayer.getCurrentTime(), urlID:regexedYoutubeURL, playerState:YTPlayer.getPlayerState(), type:"youtube"};
                setTimeout(function(){
                    socket.emit("newUserSync", newURL);
                }, 1000)
                

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

        //set bufferInProgress to prevent play and pause events from capturing during hour buffer process.
        bufferInProgress = true;

        
           
            //IF YOUTUBE
            if (globalPlayerType === "youtube"){
                console.log("checking YT buffer");

                //Pause and then play video to force buffer.
                YTPlayer.pauseVideo();
                YTPlayer.playVideo();
                 
                    
                //start interval to check for when playing.

                setTimeout(function(){
                    let YTBuffer = setInterval(YTCheck, 500);

                    function YTCheck(){
    
                        //if playing, player is buffered
                        if (YTPlayer.getPlayerState() == 1){
                            
                            //Pause
                            YTPlayer.pauseVideo();
            
                            //In two seconds
                            console.log('im buffered');
    
    
                            setTimeout(function(){
                                //Tell everyone you're buffered
                                socket.emit("isBuffered");
                            }, 200)
                            
                            clearInterval(YTBuffer);
                             
                            }  
                    }
    






                }, 500)
      
             
           
       
            
            
            }



            
            
            if (globalPlayerType === "directLink"){

            //IF DIRECT LINK
            //Look for player state
                    socket.emit("Pause");
                if (player.readyState == 4){

                    console.log("buffered");
                    socket.emit('isBuffered');
                 

                }  
            }

        
    });


    //--------------------- PAUSE ---------------------//

    socket.on('Pause', () => {

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){
            $('.transparentOverlay').css("display", "none");
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
            if (time !== undefined ){
            YTPlayer.seekTo(time);
        }
            socket.emit('newTime', YTPlayer.getCurrentTime());
            YTPlayer.playVideo();
            lastState = 3;
            bufferInProgress = false;
            console.log('playing video, buffering = ' + bufferInProgress);
            

        //IF DIRECT LINK
        } else {
            player.play();
        }

    });


  