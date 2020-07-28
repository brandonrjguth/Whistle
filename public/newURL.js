

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
                $('#video').attr('src', '');
                $('#video').css('display', 'none');
                //remove the youtube iframe
                $("#YTPlayer").remove();
                //create a new div for the new iframe to be inserted into.
                $("#embeddedArea").append("<video id=\"YTPlayer\" style=\"display:block\"></video>");

                
                globalPlayerType = 'youtube';
                socket.emit('globalPlayerType', globalPlayerType);

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
                    seekBarTracker();
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
                $("#video").after("<video id=\"YTPlayer\" style=\"display:none\"></video>");
                $("#video").css("display", "block");
                $("#video").attr("src", newURL.url);
                player = $("#video").get(0);

            } else {

                //CHANGE URL
                $("#video").attr("src", newURL.url);

            }

            globalPlayerType = "directLink";
            socket.emit('globalPlayerType', globalPlayerType);

                //STARTUP SEEKBAR LISTENER

                    player.onloadedmetadata = function(){
                        //start the seekBar function when the metadata from the video is fully loaded
                        seekBarTracker();
                    };
        }                  
});


   

    


