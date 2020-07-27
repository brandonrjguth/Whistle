    //---------------------  NEW URL ---------------------//



    //(MUST BE FIRST BECAUSE THIS IS WHEN YOUTUBE API BECOMES SUBSTANTIATED)
    //Change the URL to the received URL.


    //IF NEW URL RECIEVED, OR NEW USER RECEIVES URL FROM OTHER CLIENTS
    socket.on('newURL', (newURL) => {

        console.log("Received URL")
        console.log(newURL);

        if (newURL.type == 'youtube'){

                regexedURL = newURL.url;


        //IF YOUTUBE -------------------------------------------------------------------------------------------------------------------------------------------------------

                $('#video').css('display', 'none');
                //remove the youtube iframe
                $("#YTPlayer").remove();
                //create a new div for the new iframe to be inserted into.
                $("#embeddedArea").append("<video id=\"YTPlayer\" style=\"display:block\"></video>");

                globalPlayerType = 'youtube';


                //----------------------------------- DO THIS WHEN THE IFRAME IS READY ---------------------------------------------//
              
            
                //Start interval that waits for window.YT to be detected
                let windowReady = setInterval(isWindowReady, 300);
                function isWindowReady(){

                    //If window.YT is ready
                    if (window.YT){
                        clearInterval(windowReady);

                         //insert a new player
                            YTPlayer = new YT.Player('YTPlayer', {
                            height: 500,
                            width: 300,
                            playerVars: {'autoplay': 0, 'controls': 0, "disablekb":1, "rel": 1, "modestbranding": 1},
                            events: {
                                'onReady': onPlayerReady,
                                'onStateChange': onPlayerStateChange
                                
                                },
                            videoId: newURL.url     
                    });
                }
            }
            
      
                //--------------------------------------------- DO THIS WHEN THE PLAYER IS READY ----------------------------------------------------------//


                function onPlayerReady() {

        
                //----------------------------------------START UP SEEK BAR ----------------------------------------------//


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
                        if(videotime !== oldTime && seekbarHeld !== true) {
                            //
                            $(".seekBar").val(videotime);       
                        }


                        //CLEAR INTERVAL IF PLAYERTYPE CHANGES
                        if (globalPlayerType !== "youtube"){
                            clearInterval(timeupdater);
                        }
                    }
                    timeupdater = setInterval(updateTime, 1000);

                //----------------------------------------------------------------------------------
                }




                //--------------------------- WHEN THE PLAYER EVENT CHANGES ----------------------------------//

                function onPlayerStateChange(event){

                    console.log('state change  ' + event.data);


                    //IF play event is fired, paused was last, and bufferInProgress hasn't been triggered (SHOULD ONLY TRIGGER IF USER HITS PLAY OR PAUSE IN WINDOW)
                    if (event.data == 1 && lastState == 2 && buffering == false){

                        let client = {id:socket.id, time:YTPlayer.getCurrentTime()};
                        socket.emit('checkBuffer', client);

                    }

                    //If pause event was fired, and bufferInProgress hasn't been triggered. (SHOULD ONLY TRIGGER IF USER HITS PLAY OR PAUSE IN WINDOW)
                    if (event.data == 2 && lastState == 1 && buffering == false){
                        socket.emit('Pause');
                        console.log('paused from event change')
                        
                    }

                    lastState = event.data;

                }       
            
                //--------------------------------------------------------------------





        // IF DIRECT LINK -----------------------------------------------------------------------------------------------------------------------------------------------------------------

        } 
        
        if (newURL.type == 'directLink')

        {
                //STARTUP SEEKBAR LISTENER
                
                let seekBarListener = () => {
                    
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


   

    


