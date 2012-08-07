include_facebook();
Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');

Meteor.autosubscribe(function () {
  Meteor.subscribe('songs');
  Meteor.subscribe('playlists');
  Meteor.subscribe('playchannels');
});
/*
var insertedNodes = [];
document.addEventListener("DOMNodeInserted", function(e) {
 console.log(e.target);
}, false);
*/
var SYNC = false;
var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var currentSelected = -1;
var HAS_INPUT_EVENT = 0;
var YT_API_READY = 0;
if(typeof QueryString.listkey !== "undefined"){
  Session.set('listkey', QueryString.listkey)
}
if(typeof QueryString.playchannel !== "undefined"){
  Session.set('playchannel', QueryString.playchannel);
  PlayChannels.find({_id:Session.get('playchannel')}).observe({
    added: function (item) {
      Session.set('listkey', item.playlist);
      setCurrent('set',Session.get('current'));
    } 
  });  
}else{
  checkListKey();
}





if(!Meteor.user()){
  var username = 'anonym'+Meteor.uuid();
  var password = Meteor.uuid()
  Meteor.createUser({username:username, password:password}, {anonym:true}, function(r){
    Meteor.loginWithPassword(username, password);
  });
}
$(document).ready(function(){
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
});

var player;
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function login(type){
  if(type==='facebook'){
    Meteor.loginWithFacebook(); 
  }else if(type==='google'){
    Meteor.loginWithGoogle();
  }

}
function logout(){
  Meteor.logout();
}
function checkListKey(name){
  if(Meteor.user() && !Session.get('listkey')){
    name = (name)? name : Meteor.uuid();
    var list =  PlayLists.insert({name:name, user:Meteor.user()._id, timestamp:timestamp()});
    console.log(list);
    Session.set('listkey',list);
    checkPlayChannel();
  }
}
function checkPlayChannel(){
  if(Meteor.user() && Session.get('listkey') && !Session.get('playchannel')){
    pchannel =  PlayChannels.insert({playlist:Session.get('listkey'), user:Meteor.user()._id, current:Session.get('current'), timestamp:timestamp()});
    Session.set('playchannel',pchannel);
  }
}
function onYouTubeIframeAPIReady() {
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  if(cursor.count()){
    playSong(cursor.fetch()[0].name);    
  }
}
function playSong(vid){
    YT_API_READY = 1;
    if(!player){
      player = new YT.Player('player-div', {
        height: '300',
        width: '100%',
        videoId: vid,
        playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }else{
      player.loadVideoById(vid);
      player.playVideo();
    }
}
function onPlayerReady(event) {
  player.playVideo();
}
function onPlayerStateChange(event) {
  if(event.data==YT.PlayerState.ENDED){
    nextSong();  
  }
}
function stopVideo() {
  player.stopVideo();
}  
function nextSong(){
  setCurrent('modify',1);
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
  if(c)
    playSong(c.name);
  else {
    setCurrent('set',0);
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
    playSong(c.name);
  }
}
function setCurrent(m,i){
  old_current = current;
  if(m=='modify'){
    Session.set('current', Session.get('current') + i);
  }else if(m=='set'){
    Session.set('current', i);
  }
  
  if(Session.get('playchannel') ){
    PlayChannels.update({_id:Session.get('playchannel')}, { $set: { current : Session.get('current') }} );    
  }
}
Template.currentvideo.currentVideo = function(){
  if(PlayChannels.findOne(Session.get('playchannel'))){
    var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[currentPlayChannel.current];
    return c;
  }
  return false;
};
Template.currentvideo.on_current_video_ready = function(){
  if(SYNC){
    Meteor.flush();
    Meteor.defer(function(){
      if(PlayChannels.findOne(Session.get('playchannel'))){
        var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
        var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[currentPlayChannel.current];
        if(c) playSong(c.name);
      }
      return false;    
    });
  }
};
Template.shares.playlist_url = function(){
  return window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey');
}
Template.shares.playchannel_url = function(){
  if(typeof Session.get('playchannel')==="undefined")
    return false;
  else
    return window.location.protocol+'//'+window.location.host+"/?playchannel="+Session.get('playchannel');
};
Template.shares.on_playchannel_ready = function(){
  
  if(typeof(FB)!=='undefined'){
    Meteor.flush();
    Meteor.defer(function(){
      FB.XFBML.parse();    
    });
  }
};
Template.shares.events = {
  'click #playlist_url': function(e){
    Meteor.flush();
    $(e.target).select();
  },
  'click #playchannel_url': function(e){
    Meteor.flush();
    $(e.target).select();  
  }
};
Template.playlists.mylists = function(){
  return PlayLists.find({user:this.userId})
};
Template.playlists.events = {
  'click span':function(e){
    Session.set("playchannel",undefined);
    Session.set("listkey",this._id);
  }
};
Template.search.on_ready_search = function(){
  Meteor.flush();
  Meteor.defer(function(){
    
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
  });
};
Template.search.events = {
  'keydown input.nextsong':function(e){
    if(jQuery.inArray(e.keyCode, CONTROL_KEYCODES)!=-1){
      autocompleter = $('#autocompleter li');
      old = currentSelected;
      if(currentSelected ==-1){
        currentSelected = 0;
      }else if(currentSelected==autocompleter.length-1 && e.keyCode == 40){
        currentSelected=0;
      }else if(!currentSelected && e.keyCode == 38){
        currentSelected = autocompleter.length-1;
      }else{
        if(e.keyCode == 40)
          currentSelected++;
        else if(e.keyCode ==38)
          currentSelected--;
      }
      if(old!=-1) $('#autocompleter li').eq(old).removeClass('selected')
      $('#autocompleter li').eq(currentSelected).addClass('selected')
    }
    if(e.keyCode==ENTER){
      addSong($('#autocompleter li').eq(currentSelected));
    }
  }  
};
Template.musiclist.songs = function () {
  if(typeof Session.get('playchannel')=== "undefined"){
    checkPlayChannel();
    return Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  }else{
    var cur = PlayChannels.findOne({_id:Session.get('playchannel')});
    if(cur){
      var elements = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch();
      return elements.slice(cur.current+1, elements.length);
    }
  }
  return false;
};
Template.controls.events = {
  'click .save':function(){
    $('#save-control').toggle();
    $('#listname').select();
  },
  'click .savelist':function(){

    PlayLists.update({_id:Session.get('listkey')}, { $set:{name:$('#listname').val()} });

  },
  'click .sync':function(){
    SYNC = !SYNC;
  },   
  'click .share':function(){
    $('#shares').show();
  },
  'click .playsong': function () {    
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[0];          
    if(typeof c !== "undefined"){
      checkPlayChannel();
      setCurrent('set',0);
      playSong(c.name);
    }
  },
  'click .clearlist': function () {         
      Songs.remove({listkey:Session.get('listkey')});
   },      
  'click .skip': function () {
      nextSong();
   }  
};

Template.musiclist.events = {
  'click .vote': function () {
    Songs.update({_id: this._id},{$inc:{score:1}});
  }, 
  'click .delete': function () { 
    Songs.remove(this._id);
  },
  'click span.title': function () {
    checkPlayChannel();
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch(); 
    for(k=0,l=c.length;k<l;k++){
      if(c[k]._id == this._id){
        setCurrent('set',k);
        playSong(c[k].name);
      }
    }
   }  
};
Template.navbar.signedup = function(){
  return checkSigned();
};
Template.musiclist.invokeAfterLoad = function () {
  Meteor.defer(function () {
    $('.tip').tooltip({animation:true,placement:'bottom'});
  });
  return "";
};
function checkSigned(){
  var u = Meteor.user();
  if(u && u.anonym)
    return false;
  return true;  
}
function addSong(jselector){
  Meteor.flush();
  var vid = get_youtube_id(jselector.children('a').attr("href"));
  var title = jselector.children('a').attr("title");
  var item_min_score = Songs.findOne({listkey:Session.get('listkey')},{sort: {score: 1}, limit:1});
  if(item_min_score) weight = item_min_score.score - 1;

  Meteor.call('getUserServiceId',function(error,result){
    if(typeof(error) === 'undefined'){     
      fbid = (result.services.facebook) ? result.services.facebook.id : false;
      goid = (result.services.google) ? result.services.google.id : false;
      Songs.insert({name: vid, fbid:fbid, goid:goid, score: weight, title:title, listkey:Session.get('listkey'), timestamp:timestamp()});
    }
  });
  $("#autocompleter").hide();
  currentSelected = -1;
  $('.nextsong').val('');  
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  if(c.count()) $('ul.playlist').css("border", '1px solid #CCC');
}