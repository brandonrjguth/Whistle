//TODO: 




    //STARTUP YOUTUBE API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onload = function(){

        let fullyLoaded = setInterval(isFullyLoaded, 500)
        function isFullyLoaded(){
            if (YT.Player){
                console.log('page ready');
                clearInterval(fullyLoaded);
                socket.emit('pageReady');
            }

        };
        
    };


    //--------------TIME REACHED FOR SYNCED NEW USER-----------------//

    socket.on('timeReached', () =>{
        //make timeReached true (THIS ONLY GETS SENT TO USER WHO'M IS WAITING ON THE TIMER)
        timeReached = true;
    });



    //--------------------------- NEW USER SYNC ---------------------------//
 

    socket.on("newUserSync", (newUserID) => {
        console.log('got signal from new user');

        if (globalPlayerType === 'youtube'){

            //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket with the ID of the user requesting sync.
            let videoData = {type:globalPlayerType, url:regexedURL, time:YTPlayer.getCurrentTime(), state:YTPlayer.getPlayerState(), id:newUserID};

            //send newUserSync message with this data.
            socket.emit('newUserSync', videoData);

            //start interval to check when we've progressed 10 seconds
            if (videoData.state == 1){
                let progressed = setInterval(checkProgressed, 500)
                function checkProgressed(){
                    console.log('our time :' + YTPlayer.getCurrentTime());
                    console.log('time to get to: ' + (videoData.time + 10))
                    if (YTPlayer.getCurrentTime() >= (videoData.time + 10)){

                        //let server know we've progressed and clear interval.
                        clearInterval(progressed);
                        console.log('sending time reached');
                        socket.emit('timeReached', videoData);
                    }

                }
            }

        } else if (globalPlayerType === 'directLink'){
            //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket with the ID of the user requesting sync.
            let videoData = {type:globalPlayerType, url:regexedURL, time:player.currentTime, state:player.paused, id:newUserID};
            socket.emit('newUserSync', videoData);


            //start interval to check when we've progressed 10 seconds
            if (videoData.state === false){
                let progressed = setInterval(checkProgressed, 500)
                function checkProgressed(){
                    console.log('our time :' + player.currentTime);
                    console.log('time to get to: ' + (videoData.time + 10))
                    if (player.currentTime >= (videoData.time + 10)){

                        //let server know we've progressed and clear interval.
                        clearInterval(progressed);
                        console.log('sending time reached');
                        socket.emit('timeReached', videoData);
                    }

                }
            }

        }

        
    });
             
            
        

    //----------------------- CHECK BUFFER ---------------------//
    
   
    socket.on("checkBuffer", (newClient) => {
        //set buffering to true
        buffering = true;
        console.log('got here')

        //IF THIS IS A YOUTUBE VIDEO
        if (globalPlayerType === 'youtube'){
            //Start interval that waits for youtubeplayer to be ready.
            let checkStarted = setInterval(isStarted, 200);
            function isStarted(){

                //When function is available which means youtubeplayer is ready, play
                if (YTPlayer.playVideo()){
                    YTPlayer.playVideo()
                    
                    //clear interval waiting for player to be ready.
                    clearInterval(checkStarted);


                    //Create interval to check that video if playing, which means it's buffered.
                    let checkBuffer = setInterval(isReady, 500);

                    function isReady(){
                        console.log("checkin buffer baby");

                        //Once playing status detected, which means buffer pause video.
                        if (YTPlayer.getPlayerState() === 1){
                            YTPlayer.pauseVideo();
                            //Clear interval that checks if player is buffered
                            clearInterval(checkBuffer);


                            //Create interval that checks if player has paused
                            let checkPaused = setInterval(isPaused, 500);

                            function isPaused(){
                                if (YTPlayer.getPlayerState() === 2){
                                    console.log('Im paused and buffered.');
                                    console.log(newClient);
                                    socket.emit('isBuffered', newClient.time);
                                    console.log(socket.id);
                                    clearInterval(checkPaused);
                                };
                            }; 
                        };
                    };
                };
            }; 


        //IF THIS IS A DIRECT LINK
        } else if (globalPlayerType === 'directLink'){
            

            //Start interval to wait for buffered and ready
            let isLinkBuffered = setInterval(checkLinkBuffered, 500)
            function checkLinkBuffered(){

                if (player.readyState == 4){
                    clearInterval(isLinkBuffered);
                    console.log("buffered");
                    socket.emit('isBuffered', newClient.time);
                 
    
                }  

            }
           

        }
    });




    //--------------------- PAUSE ---------------------//

    socket.on('Pause', () => {

        if (globalPlayerType === 'youtube'){

            YTPlayer.pauseVideo();
            buffering = false;

        } else if (globalPlayerType === 'directLink'){

            player.pause();

        }

     
    });




     //-------------------- PLAY -----------------------//

    socket.on('Play', (time) => { 
    

        if (globalPlayerType === 'youtube'){

            //Setinterval to detect when the playVideo function is Ready. 
            YTPlayer.playVideo();

            let checkBuffer = setInterval(isReady, 500);

            function isReady(){
                console.log("Playing");
                //Once playing status detected, which means buffer pause video.
                if (YTPlayer.getPlayerState() === 1){

                    //Seek to the oldest time once the video is playing and buffered. This keeps everyone 
                    //perfectly synced without losing time.
                    YTPlayer.seekTo(time);
                    buffering = false;
                    clearInterval(checkBuffer);
                }
            };

        } else if (globalPlayerType === 'directLink'){

             //Setinterval to detect when the playVideo function is Ready. 
            
             player.play()

             let checkBuffer = setInterval(isReady, 500);
 
             function isReady(){
                 console.log("Playing");
                 //Once playing status detected, which means buffer pause video.
                 if (player.paused === false){
 
                     //Seek to the oldest time once the video is playing and buffered. This keeps everyone 
                     //perfectly synced without losing time.
                     player.currentTime = time;
                     player.play()
                     buffering = false;
                     clearInterval(checkBuffer);
                 }
             };

        }


    });




     //-------------------- PLAY BRAND NEW USER FIRST TIME -----------------------//
    socket.on('playNewUser', (videoData) => {

        if (globalPlayerType === 'youtube'){

            //Ensure buffering is enabled
            buffering = true;
            
            //start interval to wait for YT functions and window to be ready.
            let windowReady = setInterval(isWindowReady, 300);
            function isWindowReady(){
                if (window.YT){

                    //seek to everyone else's time
                    YTPlayer.seekTo(videoData.time);
                    YTPlayer.playVideo();
                    
                    //if others are paused
                    if (videoData.state === 2){
                        clearInterval(windowReady);

                        //set interval to check when buffered
                        let checkBuffer = setInterval(isReady, 500);
                        function isReady(){
                            
                            //Once playing status detected, which means buffered 
                            if (YTPlayer.getPlayerState() === 1){
                                clearInterval(checkBuffer);

                                    //pause video
                                    YTPlayer.pauseVideo();
                                    //set buffering to false
                                    buffering = false;
                                    
                            }
                        };

                    //if others are playing
                    } else {
                        //seek ahead
                        YTPlayer.seekTo(videoData.time + 10);
                        clearInterval(windowReady);

                        //start interval to check for buffer
                        let checkBuffer = setInterval(isReady, 500);

                        function isReady(){
                            console.log("Playing");
                            //Once playing status detected, which means buffered
                            if (YTPlayer.getPlayerState() === 1){
                                clearInterval(checkBuffer);
                                //pause
                                YTPlayer.pauseVideo();
                                
                                //set interval to wait for others to have reached timestamp
                                let othersHere = setInterval(checkOthersHere, 250)
                                function checkOthersHere(){
                                    console.log('checking others here');
                                    console.log('time reached = ' + timeReached);
                                
                                    //if timestamp reached
                                    if (timeReached === true){
                                        //clear interval
                                        clearInterval(othersHere);

                                        //play video
                                        YTPlayer.playVideo();

                                        //start interval to detect playing
                                        let checkBuffer = setInterval(isReady, 500);

                                        function isReady(){
                                            console.log("Playing");
                                            //Once playing status detected, make buffering false.
                                            if (YTPlayer.getPlayerState() === 1){

                                                //TODO: Consider writing logic here to find oldest time and go to it.
                                                buffering = false;
                                                clearInterval(checkBuffer);
                                            }
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }

        } else if (globalPlayerType === 'directLink'){


            //seek to everyone else's time
            player.currentTime = videoData.time;
                    
            //if others are paused
            if (videoData.state === true){
                player.pause()

            } else {

                player.currentTime = videoData.time + 10;
        
                //start interval to check for buffer
                let checkBuffer = setInterval(isReady, 500);
                function isReady(){
                    if (player.readyState === 4){
                        clearInterval(checkBuffer);

                        //set interval to wait for others to have reached timestamp
                        let othersHere = setInterval(checkOthersHere, 500)

                        function checkOthersHere(){
                            if (timeReached === true){
                                clearInterval(othersHere);
                                player.play();

                            }
                        }
                    }
                }
            }


        }


    });

  