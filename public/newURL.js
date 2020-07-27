    //---------------------  NEW URL ---------------------//



    //(MUST BE FIRST BECAUSE THIS IS WHEN YOUTUBE API BECOMES SUBSTANTIATED)
    //Change the URL to the received URL.


    //IF NEW URL RECIEVED, OR NEW USER RECEIVES URL FROM OTHER CLIENTS
    socket.on('newURL', (newURL) => {

        console.log("Received URL")
        console.log(newURL);
        regexedURL = newURL.url;

        if (newURL.type == 'youtube'){

                


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

                        //send checkBuffer signal with current time
                        let client = {id:socket.id, time:YTPlayer.getCurrentTime()};
                        socket.emit('checkBuffer', client);

                    }

                    //If pause event was fired, and bufferInProgress hasn't been triggered. (SHOULD ONLY TRIGGER IF USER HITS PLAY OR PAUSE IN WINDOW)
                    if (event.data == 2 && lastState == 1 && buffering == false){

                        //Pause everyone
                        socket.emit('Pause');
                        console.log('paused from event change')
                        
                    }

                    //the next time it is triggered again, lastState will be the event state that just triggered prior to this.
                    lastState = event.data;

                }       
            
                //--------------------------------------------------------------------





        // IF DIRECT LINK -----------------------------------------------------------------------------------------------------------------------------------------------------------------

        } 
        
        if (newURL.type == 'directLink')

        {



              //IF CURRENT PLAYER IS YOUTUBE
              if (globalPlayerType === "youtube"){
                
                //HIDE YOUTUBE PLAYER AND SHOW MP4 PLAYER, CHANGE URL, ADD DIV TO BE CHANGED BACK TO YOUTUBE IFRAME IF CALLED AGAIN
                $("#YTPlayer").remove();
                $("#embeddedArea").append("<video src=\"\" id=\"video\"></video>");
                $("#video").after("<video id=\"YTPlayer\" style=\"display:none\"></video>");
                $("#video").css("display", "block");
                $("#video").attr("src", newURL.url);
                player = $("#video").get(0);

                //CHANGE GLOBAL PLAYER TYPE TO DIRECTLINK
                globalPlayerType = "directLink";

       
            


            } else {

                console.log('changing url');
                console.log(newURL);

                //CHANGE URL
                $("#video").attr("src", newURL.url);
                globalPlayerType = "directLink";
                

            }
































                //STARTUP SEEKBAR LISTENER
                
                let seekBarListener = () => {
                    
                    let videotime

                    //video length is the duration of the video in player.
                    videoLength = player.duration;

                    //set html seek bars max value to the value of the video length
                    $(".seekBar").attr("max", videoLength);

                    function updateTime(){

                        //start interval every half second  
                        
                        //let old time equal current time
                        let oldTime = videotime;

                            //set videotime to the current time
                            if(player && player.currentTime) {
                                videotime = player.currentTime;
                            }

                            //if video time is not the same as the time last checked
                            if(videotime !== oldTime) {
                                console.log(videotime);
                                console.log(videoLength);

                                //change the seek bar to new video time
                                $(".seekBar").val(videotime);       
                            }

                            //if player type changes
                            if (globalPlayerType !== "directLink"){
                                //clear interval
                                clearInterval(timeupdater);
                            }
                        }
                        
                        timeupdater = setInterval(updateTime, 500);
                    }

                    player.onloadedmetadata = function(){
                        //start the seekBar function when the metadata from the video is fully loaded
                        seekBarListener();
                    };
        }                  
});


   

    


