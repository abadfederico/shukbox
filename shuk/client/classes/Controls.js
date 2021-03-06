(function(window){
  function Controls(){
    var that = this;
    this.play = function(vid){
        if(typeof(player) === 'undefined' || !player){
          player = new YT.Player('player-div', {
            height: '300',
            width: '100%',
            videoId: vid,
            playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
            events: {
              'onReady': function(event){
                player.playVideo();
              },
              'onStateChange': that.onPlayerStateChange
            }
          });
        }else if(player){
          player.loadVideoById(vid);
          player.playVideo();      
        }
    };
    this.onPlayerStateChange = function(event) {
      if(event.data==YT.PlayerState.ENDED){
        that.next();  
      }
    };
    this.stop = function() {
      if(player){
        player.stopVideo();
        player.destroy();    
      }
      player = null;
    };  
    this.next = function(){
      that.setCurrent('modify',1);
      var c = Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[Session.get('current')];
      if(c)
        that.play(c.vid);
      else {
        if(Session.get('repeat')){
          that.setCurrent('set',0);
          c = Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[Session.get('current')];
          that.play(c.vid);
        }
      }
    };
    this.setCurrent = function(m,i){
      if(m=='modify'){
        Session.set('current', Session.get('current') + i);
      }else if(m=='set'){
        Session.set('current', i);
      } 
      if(Session.get('listkey') && Session.get('current') != -1){      
        PlayLists.update({_id:Session.get('listkey')}, { $set: { current : Session.get('current') }} );    
      }
    };
  }

  window.Controls = Controls;
})(window);