


//TODO: 





    //STARTUP YOUTUBE API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onload = function(){

        let fullyLoaded = setInterval(isFullyLoaded, 500)
        function isFullyLoaded(){
            if (YT.Player && video){
                console.log('page ready');
                clearInterval(fullyLoaded);
                socket.emit('pageReady');
            }

        };
        
    };


    //-------------- EVERYONE HAS CAUGHT UP TO OUR TIME TO PLAY FOR NEW USER -----------------//

    socket.on('timeReached', () =>{
        //make timeReached true (THIS ONLY GETS SENT TO USER WHO'M IS WAITING ON THE TIMER)
        timeReached = true;
    });



    //--------------------------- GET INFO FOR A NEW USER IF YOU'RE THE HOST ---------------------------//
 

    socket.on("newUserSync", (newUserID) => {
        console.log('got signal from new user');

            //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket with the ID of the user requesting sync.
            let videoData = {type:globalPlayerType, url:regexedURL, time:videoPlayer.time(), state:videoPlayer.state(), id:newUserID};

            //send newUserSync message with this data.
            setTimeout(function(){socket.emit('newUserSync', videoData)}, 1000)

            //start interval to check when we've progressed 10 seconds
            if (videoData.state == 1){
                let progressed = setInterval(checkProgressed, 500)
                function checkProgressed(){
                    console.log('our time :' + videoPlayer.time());
                    console.log('time to get to: ' + (videoData.time +16))
                    if (videoPlayer.time() >= (videoData.time +16)){

                        //let server know we've progressed and clear interval.
                        clearInterval(progressed);
                        console.log('sending time reached');
                        socket.emit('timeReached', videoData);
                    }
                }
            }  
    });
             
            
        

    //----------------------- CHECK BUFFER ---------------------//
    
   
    socket.on("checkBuffer", (newClient) => {
        $('.over').css('display', 'flex');
        $('#embeddedArea').css('display','none');

        //set buffering to true
        buffering = true;
        console.log('got here')

        //IF THIS IS A YOUTUBE VIDEO
        
            //Start interval that waits for youtubeplayer to be ready.
            let checkStarted = setInterval(isStarted, 200);
            function isStarted(){

                //When function is available which means youtubeplayer is ready, play
                if (videoPlayer.play()){
                    //videoPlayer.play()
                    
                    //clear interval waiting for player to be ready.
                    clearInterval(checkStarted);


                    //Create interval to check that video if playing, which means it's buffered.
                    let checkBuffer = setInterval(isReady, 1000);

                    function isReady(){
                        console.log("checkin buffer baby");

                        //Once playing status detected, which means buffer pause video.
                        if (videoPlayer.buffered() === true && videoPlayer.state() === 1){
                           
                            videoPlayer.pause();
                            //Clear interval that checks if player is buffered
                            clearInterval(checkBuffer);


                            //Create interval that checks if player has paused
                            let checkPaused = setInterval(isPaused, 500);

                            function isPaused(){
                                if (videoPlayer.state() === 2){
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


    });



    //--------------------- NEW TIME FOR ALL---------------------//
    socket.on('newTime', (client) => {
        $('.over').css('display', 'flex');
        $('#embeddedArea').css('display','none');
        console.log('received new time socked');
        console.log(client.time);
        videoPlayer.seek(client.time); 
        oldTime = client.time;
        console.log('client state = '+client.state)

        
        if (client.state === 2){

            console.log('client state = '+client.state)
            videoPlayer.play()

            //interval to check if buffering
            let isBuffering = setInterval(checkBuffering, 1000)
            function checkBuffering(){
            
                //if buffering

                 if (videoPlayer.state() === 1){
                console.log('time to pause')
                    $('.over').css('display', 'none');
                    $('#embeddedArea').css('display','block');
                

                    videoPlayer.pause()
                    clearInterval(isBuffering);
                }
                else if (videoPlayer.state() === 3){
                    console.log('bufferin')
                    clearInterval(isBuffering);

                    //check to see when playing
                    let isPlaying = setInterval(checkPlaying, 600)
                    console.log('starting playing interval');
                    function checkPlaying(){
                        console.log('playing interval');
                        if (videoPlayer.state() === 2){
                            clearInterval(isPlaying);
                            console.log('got playing')
                            //videoPlayer.pause()
                            $('.over').css('display', 'none');
                            $('#embeddedArea').css('display','block');
                        }

                    }
                }
            }
            

           
        }
    });

    //--------------------- FIND TIME TO GIVE TO NEW USER ---------------------//
    socket.on('syncTimeNewUser', (clientID) => {
        let newClient = {id:clientID, time:videoPlayer.time()};
        socket.emit('syncTimeNewUserFinal', newClient);
    });

    //--------------------- RECIEVE TIME AS NEW USER TO ADJUST FINAL SYNC ---------------------//
    socket.on('syncTimeNewUserFinal', (time) => {
        console.log('making videos sync final = ' +  time);
        videoPlayer.seek(time + .112);
    });


    //--------------------- PAUSE ---------------------//

    socket.on('Pause', () => {

        videoPlayer.pause()
        buffering = false;

    });


     //-------------------- PLAY -----------------------//

    socket.on('Play', (time) => { 
    

            //Setinterval to detect when the playVideo function is Ready. 
            videoPlayer.play();

            let checkBuffer = setInterval(isReady, 500);

            function isReady(){
                console.log("Playing");
                //Once playing status detected, which means buffer pause video.
                if (videoPlayer.state() === 1){

                    //Seek to the oldest time once the video is playing and buffered. This keeps everyone 
                    //perfectly synced without losing time.
                    videoPlayer.seek(time);
                    buffering = false; 
                    $('.over').css('display', 'none');
                    $('#embeddedArea').css('display','block');
                    clearInterval(checkBuffer);
                }
            };

    });




     //-------------------- PLAY BRAND NEW USER FIRST TIME-----------------------//

    socket.on('playNewUser', (videoData) => {

       

            //Ensure buffering is enabled
            buffering = true;
            
            //start interval to wait for YT functions and window to be ready.
            let windowReady = setInterval(isWindowReady, 300);
            function isWindowReady(){
                if (window.YT){

                    //seek to everyone else's time
                    videoPlayer.seek(videoData.time);
                    videoPlayer.play();
                    
                    //if others are paused
                    if (videoData.state === 2){
                        clearInterval(windowReady);

                        //set interval to check when buffered
                        let checkBuffer = setInterval(isReady, 500);
                        function isReady(){
                           
                            
                            //Once playing status detected, which means buffered 
                            if (videoPlayer.state() === 1){
                                clearInterval(checkBuffer);
                                
                                    //pause video
                                    videoPlayer.pause()
                                    //set buffering to false
                                    buffering = false;
                                    $('.over').css('display', 'none');
                                    $('#embeddedArea').css('display','block');
                                    
                            }
                        };

                    //if others are playing
                    } else {
                        //seek ahead
                        videoPlayer.seek(videoData.time +15);
                        clearInterval(windowReady);

                        //start interval to check for buffer
                        let checkBuffer = setInterval(isReady, 500);

                        function isReady(){
                            console.log("Playing");
                            //Once playing status detected, which means buffered
                            if (videoPlayer.state() === 1){
                                clearInterval(checkBuffer);
                                //pause
                                videoPlayer.pause()
                                
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
                                        videoPlayer.play();
                                        socket.emit('syncTimeNewUser', socket.id);

                                        //start interval to detect playing
                                        let checkBuffer = setInterval(isReady, 500);

                                        function isReady(){
                                            console.log("Playing");
                                            //Once playing status detected, make buffering false.
                                            if (videoPlayer.state() === 1){

                                                //TODO: Consider writing logic here to find oldest time and go to it.
                                                buffering = false;
                                                
                                                $('.over').css('display', 'none');
                                                $('#embeddedArea').css('display','block');
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

    });

  