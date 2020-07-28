

let player = $("#video").get(0)
let seekbarHeld = false;
let YTPlayer;
let buffering = false;
let globalPlayerType = 'directLink';
let playing = false;
let regexedURL;
let timeReached;



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
        if(videotime !== oldTime) {
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
            type:globalPlayerType

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
            seek: function(time){return player.currentTime = time},
            duration:function(){return player.duration},
            type:globalPlayerType
        }
    }
})


    
    
    
    
    
    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 


    $("#playPause").click(function(){

            buffering = true;
            let client = {id:socket.id, time:videoPlayer.time()};

            console.log(videoPlayer.state());

            if (videoPlayer.state() === 1){
                socket.emit("Pause");
            } else if (videoPlayer.state() === 2){
                socket.emit('checkBuffer', client);
            }
    });
  




    //----------- SKIP AHEAD -----------//

    let skip = [];
    $("#skipAhead").click(function(){

    });


    //----------- SKIP BACK -----------//
    $("#skipBack").click(function(){

    
    });


    //--------------------- SEEK BAR -------------------------//

    let seekFunction = () => {};
        

    $(".seekBar").mousedown(function(){

        $(".seekBar").mouseup(function(){
                  
        })
    });


    $(".seekBar").on( "touchstart",  function() {
       
        (".seekBar").on( "touchend",  function() {
           
        });
    });
  


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
    });




    //--------------------- NEW URL BUTTON ---------------------/


    $("#urlSubmit").click(function(){
        
        let submittedURL = $(".urlInputText").val();

        //send newURL 
        socket.emit('newURL', {url:submittedURL});

        //remove text field from video input
        $(".urlInputText").val('');
        
        let newClient = {id:socket.id, time:0};

            let isLoaded = setInterval(checkLoaded, 500)
            function checkLoaded(){
                console.log('here2');
                console.log(videoPlayer.bufferedToStart());
                if (videoPlayer.bufferedToStart() === true){
                    clearInterval(isLoaded);

                    //when it's loaded, send the checkBuffer signal with start time of 0
                    socket.emit('checkBuffer', newClient);
                }
            }
   
  
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


    