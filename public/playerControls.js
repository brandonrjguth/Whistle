let player = $("#video").get(0)
let seekbarHeld = false;
let YTPlayer;
let buffering = false;
let globalPlayerType = 'directLink';
let playing = false;
let regexedURL;
let timeReached;





    //--------------------- PLAY AND PAUSE ---------------------//
    //Check player status, and then Pauses all Users, or checks the buffer of all users and resumes playing. 


    $("#playPause").click(function(){
      
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
        
        //set interval to detect when video is ready and loaded
        let isLoaded = setInterval(checkLoaded, 500)
        function checkLoaded(){
            if (YTPlayer.getPlayerState() === 5){
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


    