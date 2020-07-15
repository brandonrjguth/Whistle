
    

    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 


    $("#playPause").click(function(){


        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            //IF NOT PLAYING
            if (YTPlayer.getPlayerState() === 1 ){

                //Else make everyone pause
                socket.emit('Pause');
            }

            else  {

                //SEND EVERYONE MY TIME AND MAKE EVERYONE BUFFER TO PLAY
                socket.emit("newTime", YTPlayer.getCurrentTime());
                socket.emit('checkAllUsersBuffer');

            }

        }

        //IF DIRECTLINK
        if (globalPlayerType === "directLink"){

            if (player.paused == true){

                socket.emit('checkAllUsersBuffer');

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
                  socket.emit("checkAllUsersBuffer")
                

            } else {

              //pause
              socket.emit("Pause");
    
            }  

        //IF DIRECT LINK
        } else {

            if(player.paused === true){

                socket.emit("Pause");

            } else if (player.paused === false){

                socket.emit("checkAllUsersBuffer");

            }  
        }

       
    });


    //--------------------- SEEK BAR -------------------------//

    let seekFunction = () => {

        let clickedTime = $(".seekBar").val();
        socket.emit("newTime", clickedTime);

        if (globalPlayerType === "youtube"){

            if(YTPlayer.getPlayerState() === 1){
                socket.emit("Pause");
                

            } else {
                socket.emit("checkAllUsersBuffer")
                
            }  
    
        } else{

            if (player.paused === true){

                socket.emit("newTime", clickedTime);
                socket.emit("Pause");

            } else {

               
                socket.emit("newTime", clickedTime);
                socket.emit("checkAllUsersBuffer");
            }  
        }  
        console.log($(".seekBar").val())
    }


    $(".seekBar").click(() =>{
        seekFunction();      
    }); 

 
    $(".seekBar").on( "touchstart click",  function() {
        setTimeout(function(){seekFunction()}, 100)
        
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
            console.log(skip);
            console.log(skip.length);


                //WHEN FIRST SKIP IS DETECTED, START INTERVAL TO DETECT MORE CLICKS
                if (skip.length == 1) {
                    
                    let skips = setInterval(checkSkip, 500);

                    function checkSkip(){

                        //If after 2 seconds, the skip length is 1
                        if (skip.length == 1) {
                            console.log('here');
                            socket.emit("newTime", newTime);
                            socket.emit("checkAllUsersBuffer");
                            skip = [];
                            clearInterval(skips);

                        } if (skip.length >= 2){
                            console.log('here2');
                            skip = [];
                            socket.emit("newTime", newTime);
                            socket.emit("checkAllUsersBuffer");
                            clearInterval(skips);
                        }
                    }



                }
        } else {

            socket.emit("newTime", newTime);
            //socket.emit("Pause");

        }  

    //IF DIRECTLINK
    } else {

        let currentTime = player.currentTime;
        newTime = currentTime + 10;
        socket.emit("newTime", newTime);

        if(player.paused === true){

            socket.emit("Pause");

        } else if (player.paused === false){

            socket.emit("checkAllUsersBuffer");

        }  
    }
});


//----------- SKIP BACK -----------//
$("#skipBack").click(function(){

    //IF YOUTUBE
    if (globalPlayerType === "youtube"){

       
        let currentTime = YTPlayer.getCurrentTime();
        newTime = currentTime + 10;
        
        

        if(YTPlayer.getPlayerState() === 1){
           
            skip.push('');
            console.log(skip);
            console.log(skip.length);

                if (skip.length == 1) {
                    
                    let skips = setInterval(checkSkip, 500);

                    function checkSkip(){
                        if (skip.length == 1) {
                            console.log('here');
                            socket.emit("newTime", newTime);
                            socket.emit("checkAllUsersBuffer");
                            skip = [];
                            clearInterval(skips);

                        } if (skip.length >= 2){
                            console.log('here2');
                            skip = [];
                            socket.emit("newTime", newTime);
                            socket.emit("checkAllUsersBuffer");
                            clearInterval(skips);
                        }
                    }



                }
        } else {

            socket.emit("newTime", newTime);
            //socket.emit("Pause");

        }  

    //IF DIRECT LINK
    } else {

        let currentTime = player.currentTime;
        newTime = currentTime - 10;
        socket.emit("newTime", newTime);

        if(player.paused === true){

            socket.emit("Pause");

        } else if (player.paused === false){

            socket.emit("checkAllUsersBuffer");

        }  
    }
});

    //--------------------- NEW URL BUTTON ---------------------/

    //When the submit url button is clicked, check the input text of the new url field and make it equal to a new variable newURL.
    //send signal to "newURL" socket with the newURL which will sync all users with the new url.
    $("#urlSubmit").click(function(){
        console.log("URL submitted");
        let newURL = ({urlID:$(".urlInputText").val()});
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




    $('.chatBarForm').submit(function(e) {
        console.log('here');
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('.chatInputText').val());
        $('.chatInputText').val('');
        return false;
      });
   

    $('.usernameForm').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        


        if ($('.usernameText').val() === ""){

            if ($('.usernameForm').html().includes('usernameError') === false){
                $('.usernameForm').append("<p class=\"usernameError\">You must enter a Username before joining chat.</p>")
            } else {
              
            }    
        } else {
            myUsername = $('.usernameText').val();
            $('.newUserWrapper').css("display", "none");
            $('.chatContainer').css("display", "flex");
        }
      });

      socket.on('chat message', (msg) =>{
          console.log(msg);
          $('.msgs').append('<li class=\'username\'>' + myUsername + '</li><li class=\'msg\'>' + msg + '</li>');
      })

    