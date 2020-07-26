

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



      $('.chatBarForm').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', {msg:$('.chatInputText').val(), username:myUsername});
        $('.chatInputText').val('');
        return false;
      });
   


      socket.on('chat message', (msg) =>{
          console.log(msg);
          $('.msgs').append('<li class=\'username\'>' + msg.username + '</li><li class=\'msg\'>' + msg.msg + '</li>');
      })
