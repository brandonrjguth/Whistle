
    let player = $("#video").get(0);
    let globalPlayerType = "directLink";
    let YTPlayer;
    let lastState;
    let myUsername;
    let regexedYoutubeURL;
    let bufferInProgress = true;
    let urlClicked = false;
    let timeUpdater;
    let isNewUser = true;

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

        if (newURL.urlID === ''){
            return
        };
        $('.bufferContainer').removeClass('hidden');
        $('.playerContainer').addClass('hidden');

        if (newURL.fromButton == true){
            isNewUser = false;
        }

        $(".seekBar").val(0);

        //IF YOUTUBE
        if (newURL.type == "youtube"){
            

                bufferInProgress = false;
                //change regexed youtubeURL variable to the received urlID from the servers regexer.
                regexedYoutubeURL = newURL.urlID;        
                //IF YOUTUBE PLAYER IS ALREADY UP
                if (globalPlayerType === "youtube"){
                    //remove the youtube iframe
                    $("#YTPlayer").remove();
                    //create a new div for the new iframe to be inserted into.
                    $("#embeddedArea").append("<video id=\"YTPlayer\" style=\"display:block\"></video>");
                    
                }             
                globalPlayerType = 'youtube';

                //-------------------------------------------------------------------------------------------------
                //SET TIMEOUT AND DO THIS IN ALL IN 2 SECONDS FROM NOW --------------------------------------------

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

                    //----------------- DO THIS WHEN THE IFRAME IS READY ------------------------------------------//
                    
                    //insert a new player
                    window.YT.ready(function() {
                        YTPlayer = new YT.Player('YTPlayer', {
                        height: 500,
                        width: 300,
                        playerVars: {'autoplay': 1, 'controls': 0, "disablekb":1, "rel": 1, "modestbranding": 1},
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                            },
                        videoId: regexedYoutubeURL
                        });

                     });

                     //--------- DO THIS WHEN THE PLAYER IS READY ------------------------------------//
                        function onPlayerReady() {
                            YTPlayer.setVolume(0);
                            $('#volBar').val(prevVol);
                            bufferInProgress = true;
                            if (isNewUser == false){
                                YTPlayer.seekTo(0);
                                YTPlayer.playVideo();
                            let videoStarted = setInterval(isVideoStarted, 500)
                            function isVideoStarted(){
                                if (YTPlayer.getPlayerState() === 1){
                                    clearInterval(videoStarted);
                                    console.log("Pausing Player and sending CheckAllUsersBuffer")
                                    YTPlayer.pauseVideo();
                                    socket.emit('newTime', {time:0, roomID:newURL.roomID})
                                    socket.emit('checkAllUsersBuffer', {time:0, roomID:newURL.roomID});
                                }
                                }
                            }
                        //--------------------START UP SEEK BAR ----------------------------------------------//

                        //find length of video from YTPlayer and set the seekbars max to that time.

                        clearInterval(timeUpdater);
                        videoLength = YTPlayer.getDuration();
                        $(".seekBar").attr("max", videoLength);
                        timeUpdater = setInterval(updateTimeSeekBar, 500);
                        //-------------------------------------------------------------------------------------------------------------------//
                        
                        //SEND PLAYER TO TIME RECEIVED FROM OLDEST CLIENT 
                       // (If alone this will just go to zero and rest of this will be ignored)
                        //IF OLDEST CLIENT WAS PAUSED AND WE ARE A NEW USER

                        if (isNewUser == true){
                            YTPlayer.seekTo(newURL.time);   
                            isNewUser = false;
                            if (newURL.playerState == 2 || newURL.playerState == -1){
                                //Start up interval to see if player has buffered and started playing
                                let isPlayerReady = setInterval(checkPlayerReady, 500);
                                function checkPlayerReady(){   
                                    //If the player is playing, its buffered so pause it and clear the interval.
                                    if (YTPlayer.getPlayerState() == 1){
                                        //send signal to pause to all clients again to be sure they are all paused.
                                        socket.emit("Pause", roomID);
                                        $('.bufferContainer').addClass('hidden');
                                        $('.playerContainer').removeClass('hidden');
    
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
                                    socket.emit('Pause', roomID);
                                    //Send everyone back to the time recieved with the URL
                                    socket.emit("newTime", {time:newURL.time, roomID:roomID});
                                    //Check Everyones Buffer
                                    socket.emit("checkAllUsersBuffer", {time:newURL.time, roomID:roomID});         
                                }, 1000)   
                            }
                        }
                        isNewUser = false; 
                    }  
                },2000);

                //---- WHEN THE PLAYER EVENT CHANGES --------------------------------------------------//
                
                
                let wasPlayingBeforeSeeking = false;

                function onPlayerStateChange(event) {
                    let currentState = event.data;
                
                    if (currentState == 1 && lastState == 2 && bufferInProgress == false) {
                        console.log("unpaused");
                        socket.emit('Pause', roomID);
                        socket.emit('checkAllUsersBuffer', {time:YTPlayer.getCurrentTime(), roomID:roomID});
                    }
                
                    if (currentState == 2 && bufferInProgress == false) {
                        socket.emit('Pause', roomID);
                    }
                
                    // When a seeking event is detected (currentState == 3), store whether the video was playing before seeking
                    if (currentState == 3) {
                        wasPlayingBeforeSeeking = (lastState == 1);
                    }
                
                    lastState = currentState;
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
                $('#volBar').val(prevVol);
                player = $("#video").get(0);
                player.volume = 0;

                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                globalPlayerType = "directLink";

                if (isNewUser == true){
                    isNewUser = false;
                 }
                socket.emit('checkAllUsersBuffer', {time:0, roomID:roomID});

            } else {
                player.volume = 0;
                //CHANGE URL
                $("#video").attr("src", newURL.urlID);
                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                globalPlayerType = "directLink";

                if (newURL.playerState == true){
                    video.pause();
                    $('.bufferContainer').addClass('hidden');
                    $('.playerContainer').removeClass('hidden');
                } else {
                    if (newURL.time === undefined){
                        socket.emit('checkAllUsersBuffer', {time:0, roomID:roomID})
                    } else {
                        socket.emit('checkAllUsersBuffer', {time:newURL.time, roomID:roomID});
                    }
                }
                
            }

            //STARTUP SEEKBAR LISTENER
            let seekBarListener = () => {
                clearInterval(timeUpdater);
                YTPlayer = undefined;
                videoLength = player.duration;
                $(".seekBar").attr("max", videoLength);
                timeUpdater = setInterval(updateTimeSeekBar, 500);
            }

            player.onloadedmetadata = function(){
               seekBarListener();
            };            
        }
    });
    



    socket.on('hello', () => {
        console.log('hello');
    })

    //--------------------------- FIND TIME ---------------------------//

    //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket. 
    socket.on("newUserSync", (roomID) => {

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){
                let newURL = {time:YTPlayer.getCurrentTime(), urlID:regexedYoutubeURL, playerState:YTPlayer.getPlayerState(), type:"youtube", fromButton:false};
                setTimeout(function(){
                    socket.emit("newUserSync", {newURL:newURL, roomID:roomID});
                }, 1000)
        //IF DIRECT LINK
        } else {      
                let newURL = {time:player.currentTime, urlID: $('#video').attr("src"), playerState:player.paused, type:"directLink"};
                socket.emit("newUserSync", {newURL:newURL, roomID:roomID});
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
   
    socket.on("checkAllUsersBuffer", (time) =>{

        //If the user hasnt logged in with a username yet, send isBuffered so everyone else can keep playing.
        if ($('.newUserWrapper').hasClass("hidden") === false){
            console.log("I havent logged in tee-hee");
            socket.emit('isBuffered', {time:time, roomID:roomID});
        } else {
        
        //hide player, display buffer animation
        $('.bufferContainer').removeClass('hidden');
        $('.playerContainer').addClass('hidden');
       
        //set bufferInProgress to prevent play and pause events from capturing during hour buffer process.
        bufferInProgress = true;
            //IF YOUTUBE
            if (globalPlayerType === "youtube"){
                YTPlayer.setVolume(0);
                //start interval to check for when playing.
                setTimeout(function(){
                    YTPlayer.playVideo();
                    let YTBuffer = setInterval(YTCheck, 500);

                    function YTCheck(){
                        //if playing, player is buffered
                        console.log("YTCheck")
                        if (YTPlayer.getPlayerState() == 1){
                            //Pause
                            YTPlayer.pauseVideo();
                            //Tell everyone you're buffered
                            console.log("check complete, paused and sent is buffered");
                            clearInterval(YTBuffer);
                            socket.emit("newTime", {time:time, roomID:roomID});
                            socket.emit("isBuffered", {time:time, roomID:roomID});
                            bufferInProgress = false;
                            }  
                    }
                }, 4000)    
            }
            if (globalPlayerType === "directLink"){
            player.volume = 0;
            let currentTime = player.currentTime;
            function getBufferedPercentageFromCurrentPosition(player) {
                let bufferedPercentage = 0;
                for (let i = 0; i < player.buffered.length; i++) {
                    if (currentTime >= player.buffered.start(i) && currentTime <= player.buffered.end(i)) {
                    bufferedPercentage = ((player.buffered.end(i) - currentTime) / (player.duration - currentTime)) * 100;
                    break;
                    }
                }
                return bufferedPercentage;
            } 
            setTimeout(function(){
            //IF DIRECT LINK
            //Look for player state
                player.play();
                let GPBuffer = setInterval(GPCheck, 500);
                function GPCheck() {
                    let bufferedPercentage = getBufferedPercentageFromCurrentPosition(player);
                    console.log('buffered percent = '+bufferedPercentage);
                    if (bufferedPercentage >= 25) {
                        console.log("buffered");
                        socket.emit('isBuffered', {time:time, roomID:roomID});
                        clearInterval(GPBuffer);
                    }
                }
            }, 2000)
            }
        }
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
        if ($('.newUserWrapper').hasClass("hidden") === false){
            console.log("still not logged in teehee")
        } else{
            $('.bufferContainer').addClass('hidden');
            $('.playerContainer').removeClass('hidden');
            
            //IF YOUTUBE
            if (globalPlayerType === "youtube"){
                YTPlayer.setVolume(prevVol);
                if (time !== undefined ){
                //YTPlayer.seekTo(time);
            }
                YTPlayer.playVideo();
                lastState = 3;
                //START INTERVAL TO DETECT PLAYING BEFORE CHANGING BUFFERINPROGRESS TO FALSE
                let bufferDone = setInterval(isbufferDone, 500);
                function isbufferDone(){
                    if (YTPlayer.getPlayerState() === 1){
                        clearInterval(bufferDone);
                        bufferInProgress = false;
                    }
                }
                
            //IF DIRECT LINK
            } else {
                
                //reset volume to volume before buffer
                player.volume = prevVol/100;
                if (time !== undefined && time !== null ){
                    //player.currentTime = time;
                }
                player.play();

            }
        }

    });


  