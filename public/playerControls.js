
    

    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    
    $("#playPause").click(function(){


        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            if (YTPlayer.getPlayerState() == 2 || YTPlayer.getPlayerState() == 5 || YTPlayer.getPlayerState() == 0){
                socket.emit("newTime", YTPlayer.getCurrentTime());
                socket.emit('checkAllUsersBuffer');

            }

            else  {

                socket.emit('Pause');

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

        //Send signal to socket "newTime", syncing all users to the timestamp.
        //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

        socket.emit("newTime", newTime);


        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            if(YTPlayer.getPlayerState() === 2){
                
                socket.emit("Pause");

            } else {

                socket.emit("newTime", newTime);
                socket.emit("checkAllUsersBuffer")
                

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

    $(".seekBar").click(() =>{

        let clickedTime = $(".seekBar").val();

        if (globalPlayerType === "youtube"){

        

            if(YTPlayer.getPlayerState() === 2){
                socket.emit("newTime", clickedTime);
                socket.emit("Pause");

            } else {

               
                socket.emit("newTime", clickedTime);
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
    }); 



    //--------------------- SKIP BUTTONS ---------------------//

    //Calculates current timestamp and sets the video's current time to the timestamp plus 10 seconds.
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 

    //----------- SKIP AHEAD -----------//
    $("#skipAhead").click(function(){

        //IF YOUTUBE
        if (globalPlayerType === "youtube"){

            let currentTime = YTPlayer.getCurrentTime();
            newTime = currentTime + 10;
            socket.emit("newTime", newTime);

            if(YTPlayer.getPlayerState() === 2){

                socket.emit("Pause");

            } else {

                
                socket.emit("checkAllUsersBuffer");

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
            newTime = currentTime - 10;
            socket.emit("newTime", newTime);

            if(YTPlayer.getPlayerState() === 2){

                socket.emit("Pause");

            } else {

                socket.emit("checkAllUsersBuffer")

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
        let newURL = ({urlID:$("#urlInputText").val()});
        socket.emit('newURL', newURL);   
    });

    //FULLSCREEN BUTTON TO DO//
   
