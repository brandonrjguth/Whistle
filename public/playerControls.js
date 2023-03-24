//Function for keeping seekbar synced with videotime must be initialized here for use in the later 
//attached "videoPlayer.js"


function updateTimeSeekBar(){
    let videotime;
    let oldTime = videotime;
    if(player && player.currentTime) {
        videotime = player.currentTime;
    }

    if(YTPlayer && YTPlayer.getCurrentTime()) {
        videotime = YTPlayer.getCurrentTime();
    }

    if(videotime !== oldTime) {
       $(".seekBar").val(videotime);       
    }
}

let prevVol;
let mute;
    
    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 
    $("#playPause").click(function(){

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){
            //If playing
            if (YTPlayer.getPlayerState() === 1 ){
                //Send Pause
                socket.emit('Pause');
            }
            else  {
                //SEND EVERYONE MY TIME AND MAKE EVERYONE BUFFER TO PLAY
                socket.emit("newTime", YTPlayer.getCurrentTime());
                socket.emit('checkAllUsersBuffer', YTPlayer.getCurrentTime());
            }
        }

        //IF DIRECTLINK
        if (globalPlayerType === "directLink"){
            if (player.paused === true){
                socket.emit('checkAllUsersBuffer', player.currentTime);
            } else{
                socket.emit('Pause');
            }
        }   
    });
  
    //--------------------- GO TO TIME ---------------------//

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
                
        //Send signal to socket "newTime", syncing all users to the timestamp.
        //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 
        socket.emit("newTime", newTime);
        
        //IF YOUTUBE
        if (globalPlayerType === "youtube"){
            //IF PAUSED
            if(YTPlayer.getPlayerState() === 1){
                  //check buffer and play
                  socket.emit("checkAllUsersBuffer", newTime)
            } else {
              //pause
              socket.emit("Pause");
            }  
        //IF DIRECT LINK
        } else {
            if(player.paused === true){
                socket.emit("Pause");
            } else if (player.paused === false){
                socket.emit("checkAllUsersBuffer", player.currentTime);
            }  
        }
    });

    //--------------------- SEEK BAR -------------------------//
       let seekFunction = (clickedTime) => {
        socket.emit("newTime", clickedTime);
            if (globalPlayerType === "youtube"){
                if(YTPlayer.getPlayerState() === 1){
                    socket.emit("newTime", clickedTime);
                    socket.emit("checkAllUsersBuffer", clickedTime);
                } else {
                    socket.emit("newTime", clickedTime);
                    socket.emit("Pause");       
                }  
            } else{
                if (player.paused === true){
                    socket.emit("newTime", clickedTime);
                    socket.emit("Pause");
                } else {
                    socket.emit("newTime", clickedTime);
                    socket.emit("checkAllUsersBuffer", clickedTime);
                }  
            }  
    }

    let clickedTime;
    $(".seekBar").mousedown(function(){
        clearInterval(timeUpdater);
    });

    $(".seekBar").mouseup(function(){
        clickedTime = $(".seekBar").val();
        seekFunction(clickedTime);
        timeUpdater = setInterval(updateTimeSeekBar, 500);
    })

    $(".seekBar").on( "touchstart",  function() {
        clearInterval(timeUpdater);
        });

    $(".seekBar").on( "touchend",  function() {
        clickedTime = $(".seekBar").val();
        seekFunction(clickedTime);
        timeUpdater = setInterval(updateTimeSeekBar, 500);
    });
  
    //--------------------- SKIP BUTTONS ---------------------//

    //Calculates current timestamp and sets the video's current time to the timestamp plus 10 seconds.
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    //----------- SKIP AHEAD -----------//

let skip = [];
$("#skipAhead").click(function(){

    //IF YOUTUBE
    if (globalPlayerType === "youtube"){
        let currentTime = YTPlayer.getCurrentTime();
        newTime = currentTime + 10;
        //IF THE PLAYER IS PLAYING
        if(YTPlayer.getPlayerState() === 1){
            //ADD TO AN EMPTY SKIP ARRAY
            skip.push('');
                //WHEN FIRST SKIP IS DETECTED, START INTERVAL TO DETECT MORE CLICKS
                if (skip.length === 1) {
                    let skips = setInterval(checkSkip, 1000);
                    function checkSkip(){
                            newTime = currentTime + 10*skip.length

                            //Don't send buffer if youll skip to the end of the video
                            if ((10*skip.length)  < (YTPlayer.getDuration() - YTPlayer.getCurrentTime())){
                                socket.emit("checkAllUsersBuffer", newTime);
                            } else {
                                socket.emit("Pause");
                                socket.emit("newTime", YTPlayer.getDuration());
                            }
                            skip = [];
                            clearInterval(skips);
                    }
                }
        } else {
            socket.emit("newTime", newTime);
        }  

    //IF DIRECTLINK
    } else {

        let currentTime = player.currentTime;
        newTime = currentTime + 10;

        if(player.paused === true){
            socket.emit("newTime", newTime);
        } 
        
        else if (player.paused === false){
            //ADD TO AN EMPTY SKIP ARRAY
            skip.push('');
                //WHEN FIRST SKIP IS DETECTED, START INTERVAL TO DETECT MORE CLICKS
                if (skip.length === 1) {
                    let skips = setInterval(checkSkip, 1000);
                    function checkSkip(){
                            newTime = currentTime + 10*skip.length
        
                            //Don't send buffer if youll skip to the end of the video
                            if ((10*skip.length)  < (video.duration - player.currentTime)){
                                socket.emit("checkAllUsersBuffer", newTime);
                            } else {
                                socket.emit("Pause");
                                socket.emit("newTime", video.duration);
                            }

                            skip = [];
                            clearInterval(skips);
                    }
                }
        }  
    }
});

//----------- SKIP BACK -----------//
$("#skipBack").click(function(){
    //IF YOUTUBE
    if (globalPlayerType === "youtube"){
        let currentTime = YTPlayer.getCurrentTime();
        newTime = currentTime - 10;

        if(YTPlayer.getPlayerState() === 1){
            skip.push('');
                if (skip.length === 1) {
                    let skips = setInterval(checkSkip, 1000);
                    function checkSkip(){

                            newTime = currentTime - 10*skip.length
                            socket.emit("checkAllUsersBuffer", newTime);
                            skip = [];
                            clearInterval(skips);    
                    }
                }
        } else {
            socket.emit("newTime", newTime);
        }  

    //IF DIRECT LINK
    } else {
        let currentTime = player.currentTime;
        newTime = currentTime - 10;

        if(player.paused === true){
            socket.emit("newTime", newTime);
        } 
        
        else if (player.paused === false){
            //ADD TO AN EMPTY SKIP ARRAY
            skip.push('');
                //WHEN FIRST SKIP IS DETECTED, START INTERVAL TO DETECT MORE CLICKS
                if (skip.length === 1) {
                    let skips = setInterval(checkSkip, 1000);
                    function checkSkip(){
                            newTime = currentTime - 10*skip.length
                            socket.emit("checkAllUsersBuffer", newTime);
                            skip = [];
                            clearInterval(skips);
                    }
                }
        }  
    }
});

    //--------------------- NEW URL BUTTON ---------------------/

    //When the submit url button is clicked, check the input text of the new url field and make it equal to a new variable newURL.
    //send signal to "newURL" socket with the newURL which will sync all users with the new url.
    $("#urlSubmit").click(function(){
        let newURL = ({urlID:$(".urlInputText").val(), fromButton:true});
        socket.emit('newURL', newURL);  
    });

    //IF LOAD URL BUTTON CLICKED, HIDE THE BUTTON ROW AND SHOW THE URLLOAD ROW IN ITS PLACE
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



    // -------- Volume Control --------//
    $('#volBar').val(100);

    $('#volUp').click(function(){
        if (globalPlayerType === "youtube"){
            YTPlayer.setVolume(YTPlayer.getVolume() + 10);
            $('#volBar').val(YTPlayer.getVolume());
        } else {
            player.volume += 0.10;
            $('#volBar').val(player.volume*100);
        }
    })
    $('#volDown').click(function(){
        if (globalPlayerType === "youtube"){
            YTPlayer.setVolume(YTPlayer.getVolume() - 10);
            $('#volBar').val(YTPlayer.getVolume());
        } else {
            player.volume -= 0.10;
            $('#volBar').val(player.volume*100);
        }
    })
    $('#volMute').click(function(){
        if (globalPlayerType === "youtube"){
            if (mute === true){
                YTPlayer.setVolume(prevVol);
                mute = false;
                $('#volBar').val(prevVol);
            } else {
                mute = true;
                prevVol = YTPlayer.getVolume();
                YTPlayer.setVolume(0);
                $('#volBar').val(0);
            }
        } else {
            if (mute === true){
                player.volume = prevVol;
                mute = false;
                $('#volBar').val(player.volume*100);
            } else {
                mute = true;
                prevVol = player.volume;
                player.volume = 0;
                $('#volBar').val(0);
            }
        }
    })

    $('#volBar').click(function(){
        if (globalPlayerType === 'youtube'){
            YTPlayer.setVolume($('#volBar').val());
        } else {
            player.volume = $('#volBar').val()/100;
        }
    })



    // ----------- Chat Form ---------//
    $('.usernameForm').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        
        if ($('.usernameText').val() === ""){
            if ($('.usernameForm').html().includes('usernameError') === false){
                $('.usernameForm').append("<p class=\"usernameError\">You must enter a Username before joining chat.</p>")
            } else {
              
            }    
        } else {
            myUsername = $('.usernameText').val();
            $('.newUserWrapper').addClass("hidden");
            $('.chatContainer').css("display", "flex");
            $('.playerContainer').removeClass('hidden');
            socket.emit('sync');
        }
      });

      $('.chatBarForm').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', {msg:$('.chatInputText').val(), username:myUsername});
        $('.chatInputText').val('');
        return false;
      });
   
      socket.on('chat message', (msg) =>{
          $('.msgs').append('<li class=\'username\'>' + msg.username + '</li><li class=\'msg\'>' + msg.msg + '</li>');
      })



    