


let player = $("#video").get(0)
let seekbarHeld = false;
let YTPlayer;
let buffering = false;
let globalPlayerType = 'directLink';
let playing = false;
let regexedURL;
let timeReached;
let noSkips = true;
let skips = 0;
let videoState;
let lastVolume;


let seekBarTracker = () => {          
             
    let videotime
    //video length is the duration of the video in player.
    videoLength = videoPlayer.duration();
    //set html seek bars max value to the value of the video length
    $(".seekBar").attr("max", videoLength);
    function updateTime(){
        //start interval every half second  
        //let old time equal current time
        let oldTime = videotime;
        //set videotime to the current time
        if(videoPlayer && videoPlayer.time()) {
            videotime = videoPlayer.time();
        }
        //if video time is not the same as the time last checked
        if(videotime !== oldTime && seekbarHeld === false) {
            console.log(videotime);
            console.log(videoLength);
            //change the seek bar to new video time
            $(".seekBar").val(videotime);       
        }
        //if player type changes
        if (globalPlayerType !== videoPlayer.type){
            //clear interval
            clearInterval(timeupdater);
        }
    }
    timeupdater = setInterval(updateTime, 500);
}




//Create functions for default object videoPlayer
socket.on('globalPlayerType', (globalPlayerType) =>{

    
    console.log(globalPlayerType);
    if (globalPlayerType === 'youtube'){

        videoPlayer = {
            play: function(){return YTPlayer.playVideo()},
            pause: function(){return YTPlayer.pauseVideo()},
            time: function(){return YTPlayer.getCurrentTime()},
            state: function(){
                return YTPlayer.getPlayerState();
            },
            bufferedToStart: function(){
                if (YTPlayer.getPlayerState() === 5){
                    return true
                } else {
                    return false;
                }
            },
            seek: function(time){return YTPlayer.seekTo(time)},
            duration:function(){return YTPlayer.getDuration()},
            type:globalPlayerType,
            volume:function(volume){return YTPlayer.setVolume(volume)},
            getVolume:function(){return YTPlayer.getVolume()},
            buffered:function(){return YTPlayer.getPlayerState() === 1},

        }
    }

    if (globalPlayerType === 'directLink'){
        videoPlayer = {
            play: function(){return player.play()},
            pause: function(){return player.pause()},
            time: function(){return player.currentTime},
            state: function(){
                if (player.paused === true){
                    return 2;
                } else {
                    return 1;
                }
            },
            bufferedToStart: function(){
                if(player.readyState === 4){
                    return true;
                } else {
                    return false;
                }
            },

            buffered:function(){return player.readyState === 4},
            seek: function(time){return player.currentTime = time},
            duration:function(){return player.duration},
            type:globalPlayerType,
            volume:function(volume){return player.volume = (volume/100)},
            getVolume:function(){return player.volume*100}
        }
    }
})


    
    
    
    
    
    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 


    $("#playPause").click(function(){

            buffering = true;
            let client = {id:socket.id, time:videoPlayer.time()};

            //if playing
            if (videoPlayer.state() === 1){
                //pause
                socket.emit("Pause");
            //if paused
            } else if (videoPlayer.state() === 2){
                //check buffer
                socket.emit('checkBuffer', client);
            }
    });
  




    //----------- SKIP AHEAD -----------//

   
    $("#skipAhead").click(function(){
        
        //when clicked make variable noSkips false.
        noSkips = false;
        //add one to our skip counter
        skips++;

        //set interval for 1 second after first skip click
        if (skips === 1){
            let skipsFinished = setInterval(checkSkipsFinished, 1000)
            function checkSkipsFinished(){

                //if noSkips is true (hasn't been made false in the last second by a click)
                if (noSkips === true){
                    
                    //create new client
                    let newClient = {id:socket.id, time:videoPlayer.time() + (skips*10), state:videoPlayer.state()};
                    //reset skips to 0
                    skips = 0;
                    //send new time containing our time + skips*10
                    socket.emit('newTime', newClient);
                
                    //if we were playing
                    if (newClient.state === 1){
                        //check buffer
                        socket.emit('checkBuffer', newClient);
                    //if we were paused
                    } else if (newClient.state === 2){
                        //make buffering false
                        buffering = false;
                    }

                    clearInterval(skipsFinished);
                }
                //make noskips true again
                noSkips = true;
            }

        }
        

    });


    //----------- SKIP BACK -----------//


    //Same stuff and skipAhead
    //-----------------------

    $("#skipBack").click(function(){
        console.log(videoPlayer.time())
       noSkips = false;
       skips++;

       if (skips === 1){
           let skipsFinished = setInterval(checkSkipsFinished, 1000)
           function checkSkipsFinished(){
               if (noSkips === true){
                   

                   let newClient = {id:socket.id, time:videoPlayer.time() - (skips*10), state:videoPlayer.state()};
                   skips = 0;

                   socket.emit('newTime', newClient);
               
                   if (newClient.state === 1){
                       socket.emit('checkBuffer', newClient);
                   } else if (newClient.state === 2){
                       buffering = false;
                   }

                   clearInterval(skipsFinished);
               }
               noSkips = true;
           }

       }
       

   });

    //--------------------- SEEK BAR -------------------------//

    $(".seekBar").mouseup(function(){
        if (buffering !== true) {
            buffering = true;
        //make newClient with socket.id, the clicked or dragged to seekbar time, and the video players state upon clicking the seekbar
        let newClient = {id:socket.id, time:$(".seekBar").val(), state:videoState};
        
        //send new time with info
        socket.emit('newTime', newClient);
    
        //if our state when clicked was playing
        if (newClient.state === 1){

            //after a second, buffer and sync time again (Might be able to remove timeout)
            setTimeout(function(){socket.emit('checkBuffer', newClient)}, 1000);

        //if our state when clicked was paused
        } else if (newClient.state === 2){

            //make buffering false
            buffering = false;
        }

        //make seekbarHeld false
        seekbarHeld = false;
        }
           
    })
        

    $(".seekBar").mousedown(function(){

        //set videoState variable to current video state
        videoState = videoPlayer.state();
        
        //set seekbar held and buffering to true to prevent seekbar from changing position, or youtubes buffering process triggering events
        //buffering = true;
        seekbarHeld = true;
    });

/*
    $(".seekBar").on( "touchstart",  function() {
       
        (".seekBar").on( "touchend",  function() {
           
        });
    });
  */


    //-----------------------     SEEK DIRECTLY TO TIMESTAMP    ---------------------------//


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

        $("#second").val('');
        $("#minute").val('');
        $("#hour").val('');

        //make new client with socket.id, new time, and the player state
        let newClient = {id:socket.id, time:newTime, state:videoPlayer.state()};

        //send new time signal
        socket.emit('newTime', newClient);
        
        //if we were playing
        if (newClient.state === 1){
            //send check buffer
            socket.emit('checkBuffer', newClient);
        }
        
    });




    //--------------------- NEW URL BUTTON ---------------------/


    $("#urlSubmit").click(function(){
        
        let submittedURL = $(".urlInputText").val();

        //send newURL 
        socket.emit('newURL', {url:submittedURL});

        //remove text field from video input
        $(".urlInputText").val('');
        
        //make new client with socket.id and time equal to 0
        let newClient = {id:socket.id, time:0};

            //start interval that waits for video buffered and reayd to start
            let isLoaded = setInterval(checkLoaded, 500)
            function checkLoaded(){
                
                //if video player is buffered and ready to start
                if (videoPlayer.bufferedToStart() === true){
                    //clear interval
                    clearInterval(isLoaded);

                    //send check buffer
                    socket.emit('checkBuffer', newClient);
                }
            }
   
  
    });



    //--------------------- Volume Slider ---------------------/

    $(".volume").mousedown(function(){})

    $(".volume").mouseup(function(){
        console.log($(".volume").val())
        videoPlayer.volume($(".volume").val());
        $('.mute').css('color', 'white');
        lastVolume = $(".volume").val();
    })

    $('.mute').click(() =>{
        console.log(videoPlayer.getVolume())
        if (videoPlayer.getVolume() !== 0){
            lastVolume = $(".volume").val();
            console.log('here')
            videoPlayer.volume(0);
            $('.mute').css('color', 'red');
        } else if (videoPlayer.getVolume() === 0) {
            videoPlayer.volume(lastVolume);
            $('.mute').css('color', 'white');

        } else {
            
        }


       
    });

    $('.volUp').click(() =>{
        let volume = $(".volume").val();
        let newVolume = (parseInt(volume) + 10);
        $(".volume").val(newVolume); 
        console.log(volume);
        console.log(newVolume);
        videoPlayer.volume(newVolume);
    });

    $('.volDown').click(() =>{
        let volume = $(".volume").val();
        let newVolume = (parseInt(volume) - 10);
        $(".volume").val(newVolume); 
        console.log(volume);
        console.log(newVolume);
        videoPlayer.volume(newVolume);
    });


//-------------------------------------------------------------------HIDING CONTROLS--------------------------------------------------//
    $("#showLoadURL").click(() => {
            $('.hiddenControls').css("display", "flex");
            $('.urlLoad').css("display", "flex");
            $('.buttonRow').css("display", "none");
         
    });

    //IF SHOW TIME ICON IS CLICKED
    $("#showTimeIcon").click(() => {
        $('.hiddenControls').css("display", "flex");
        $('.seekToRow').css("display", "flex");
        $('.buttonRow').css("display", "none");
    });


    //IF VOLUME SHOW BUTTON CLICKED
    $("#volumeButton").click(() => {
        $('.hiddenControls').css("display", "flex");
        $('.volumeInput').css("display", "flex");
        $('.buttonRow').css("display", "none");
    });

    //IF HIDE CONTROLS BUTTON CLICKED
    $("#hideControls").click(() => {
        $('.urlLoad').css("display", "none");
        $('.volumeInput').css("display", "none");
        $('.seekToRow').css("display", "none");
        $('.hiddenControls').css("display", "none");
        $('.buttonRow').css("display", "flex");
    });

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


    