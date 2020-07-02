<script src="/socket.io/socket.io.js"></script>;

//Play and Pause Button. Logic to check state of video player, paused or playing, and then pauses or plays accordingly.
$("#playPause").click(function(){

    console.log(document.getElementById("video").paused);
     
    if (document.getElementById("video").paused === false){
            document.getElementById("video").pause();
            console.log(document.getElementById("video").currentTime);
        } else {
            document.getElementById("video").play();
        }                    
});



//Seek to point function. When the Seek button is pressed, do the math to calculate the seconds value of the format hh:mm:ss, and make the current time for the video element equal to that.

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

    newTime = parseInt(($("#hour").val()) * 60 * 60) + (parseInt($("#minute").val()) * 60) + parseInt($("#second").val())
    console.log(newTime);
    document.getElementById("video").currentTime = newTime;    
});

//Skip Ahead or Back Button. Calculates current timestamp and sets the video's current time to the timestamp plus 10 seconds.

$("#showSeekCommands").click(function(){
    if ($("#seekCommands").hasClass("hidden") == true){
        $("#seekCommands").removeClass("hidden");
        $("#showSeekCommands").text("Hide Timestamp Controls");
    }

    else {
        $("#seekCommands").addClass("hidden");
        $("#showSeekCommands").text("Show Timestamp Controls");
    }


    ;
    console.log();
    
});

$("#skipAhead").click(function(){
    let timeStamp = document.getElementById("video").currentTime;
    document.getElementById("video").currentTime = timeStamp + 10});

$("#skipBack").click(function(){
let timeStamp = document.getElementById("video").currentTime;
document.getElementById("video").currentTime = timeStamp - 10});


//When the URL Submit button is clicked, change the source attribute for the video element to match the text in the URL field.

$("#urlSubmit").click(function(){
    let newURL = $("#urlInputText").val();
    $("#video").attr("src", newURL);
    socket.emit('currentTime', document.getElementById("video").currentTime);
    document.getElementById("video").load();
});
