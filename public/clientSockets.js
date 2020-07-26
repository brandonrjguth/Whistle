//TODO: 


    //STARTUP YOUTUBE API
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);



    //--------------------------------- VIDEO PLAYER FUNCTIONS ---------------------------------//

      




    //--------------------------- FIND TIME ---------------------------//

    //Find the video time, src, and playing status and then submit it back to the "newUserSync" socket. 

    socket.on("newUserSync", () => {});
             
            
        

    
     //--------------------------- NEW TIME ---------------------------//

  

    socket.on('newTime', (newTime) => {

        
    });



    socket.on('findTime', (newTime) => {

        
    });



    //----------------------- CHECK ALL USERS BUFFER ---------------------//


    socket.on("checkReady", () =>{

    

    
    });

    //----------------------- CHECK ALL USERS BUFFER ---------------------//
    
   
    socket.on("checkBuffer", () => {
        //set buffering to true
        buffering = true;

        //play video
        

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
                                socket.emit('isBuffered');
                                console.log(socket.id);
                                clearInterval(checkPaused);
                            }

                        };


                    
                    }
                };






            };
        }





    


        
    });


    //--------------------- PAUSE ---------------------//

    socket.on('Pause', () => {
        YTPlayer.pauseVideo();
        buffering = false;
    });


     //-------------------- PLAY -----------------------//

    socket.on('Play', (time) => { 
        YTPlayer.playVideo();


        let checkBuffer = setInterval(isReady, 500);

        function isReady(){
            console.log("Playing");
            //Once playing status detected, which means buffer pause video.
            if (YTPlayer.getPlayerState() === 1){
                
                buffering = false;
                clearInterval(checkBuffer);
            }
        };

 
        
        

     
    });


  