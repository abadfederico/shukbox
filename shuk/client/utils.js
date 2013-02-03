function include_facebook(){
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '407750262605974', // App ID
      channelUrl : '//'+window.location.host+'/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
  };
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));  
}

/*GET TIMESTAMP*/
function timestamp(){
  return new Date().getTime();  
}

/*SIMULATE INPUT EVENT*/
var old_input_state = '';
var timer_input_event = null;
function addInputEvent(){
  var inputnode = document.getElementById("nextsong");
  old_input_state = inputnode.value;
  timer_input_event = Meteor.setInterval(function(){
    if(old_input_state !== inputnode.value){
      searchWidget.search(inputnode.value);
      old_input_state = inputnode.value;
      autocomple_offset = 1;
    }
    if(inputnode.value===''){
      var autocompleter = document.getElementById("autocompleter");
      if(autocompleter) autocompleter.style.display = 'none';
      currentSelected = -1;
    }
  }, 100);
}
function removeInputEvent(){
  Meteor.clearInterval(timer_input_event);
}
/*END SIMULATE INPUT EVENT*/

function popup(link, obj){
  window.open(link, 'popup', 'height='+obj.height+',width='+obj.width+',toolbar=1');
}
function undef(obj){
 return typeof obj === 'undefined';
}
function setModalMessage(title, body){
  $('.modal-header h3').html(title);
  $('.modal-body p').html(body);
}
function log(args){
  if(typeof console !== 'undefined')
    console.log(args);
}