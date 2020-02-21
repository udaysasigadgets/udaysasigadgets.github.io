/*
 * Version 1.9 - Support for single match live at any time
 */
var FifaWorldCup2014 = {

  matchesUrl: 'http://lup.fifa.com/live/common/competitions/worldcup/_feed/_listmachlive.js',
  //liveMatchId: null,
  liveMatches: {},
  //title: null, 
  //lastPostTime: (new Date(2014,0,1)).getTime(),
  tournmentEndDate: new Date(2014,6,14),
  secondStageStartDate: new Date(2014,5,28),
  quarterFinalsStartDate: new Date(2014,6,4),
  semiFinalsStartDate: new Date(2014,6,8),
  thirdPlaceMatchStartDate: new Date(2014,6,12),
  finalMatchStartDate:  new Date(2014,6,13),
  tournmentDoneMsgDate: (typeof localStorage['tournmentDoneMsgDate']==='undefined')?(new Date(2014,0,1)).getTime():localStorage['tournmentDoneMsgDate'],
  
  service : null, 
  tracker: null,
  init : function() {
	  var _this = this;
	  try {
		  this.service = analytics.getService('FWC_2104_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-30');
		  this.tracker.sendAppView('MainView');
	  } catch(e) {
		  
	  }
	  
	  _this.requestOngoingMatchesInfo();

  },
  
  getCurrentStage : function() {
	  var curDate = new Date();
	  var stage = '255931';
	  if(curDate.getTime()>this.finalMatchStartDate.getTime()) {
		  stage = '255959';
	  } else if(curDate.getTime()>this.thirdPlaceMatchStartDate.getTime()) {
		  stage = '255957';
	  } else if(curDate.getTime()>this.semiFinalsStartDate.getTime()) {
		  stage = '255955';
	  } else if(curDate.getTime()>this.quarterFinalsStartDate.getTime()) {
		  stage = '255953';
	  } else if(curDate.getTime()>this.secondStageStartDate.getTime()) {
		  stage = '255951';
	  } else {
		  stage = '255931';  
	  }
	  return stage;
  },
  
  requestOngoingMatchesInfo: function() {
	  var _this = this;
	  
	  setTimeout(function() {
		  _this.requestOngoingMatchesInfo();
	  }, 15000);
	  
	  //Reset the ID Arr
	  this.liveMatchesIdArr = [];
	  
	  var curDate = new Date();
	  if(curDate.getTime() > this.tournmentEndDate.getTime()) {
		  //Do not show this message for another day
		  if(curDate.getTime()-parseInt(this.tournmentDoneMsgDate, 10)>1000*60*60*24) {
			  this.tournmentDoneMsgDate = curDate.getTime();
			  localStorage['tournmentDoneMsgDate'] = this.tournmentDoneMsgDate;
			  this.displayUninstallMessage();
		  } 
		  return;
	  }
	  
	  var req = new XMLHttpRequest();
	  req.open("GET", this.matchesUrl, true);
	  req.onload = this.processOngoingMatchesInfo.bind(this);
	  req.send(null);
  },
  
  processOngoingMatchesInfo: function(e) {
	  var _this = this;
	  
	  var resp = e.target.responseText;
	  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
	  if(jsonText==='') {
		  return;
	  }
	  var ongoingObj = JSON.parse(jsonText);
	  var matches = ongoingObj['matches'];
	  //console.log('Number of matches :'+matches.length);
	  matches = $.grep(matches, function(o,i) {
		  return o['s']==='live';
	  });
	  //console.log('Number of live matches :'+matches.length);
	  
	  if(matches.length===0) {
		  //console.log('No ongoing matches');
		  return;
	  }
	  
	  $.each(matches, function(i, match) {
		  
		  _this.liveMatchesIdArr.push(match['id']);
		  
		  if(typeof _this.liveMatches[match['id']]==='undefined') {
			  //Object not present. Create one..
			  _this.liveMatches[match['id']] = {
			    'liveMatchScore' : match['r'],
			    'lastPostTime' : (new Date(2014,0,1)).getTime()
			  };
		  } else {
			  //Update the score
			  _this.liveMatches[match['id']]['liveMatchScore'] = match['r'];
		  }

	  });
	  
	  //Cleanup task to keep the object count to a minimum - Otherwise will grow over time
	  $.each(_this.liveMatches, function(key, value) {
		 if(_this.liveMatchesIdArr.indexOf(key)===-1) {
			 //No Longer Live
			 //console.log('Deleting data for '+key);
			 delete _this.liveMatches[key];
		 } else {
			 //Still Live.. Make a call to get the latest match data
			 window.setTimeout(function() {
				  //console.log('Calling for data for '+key);
				  _this.requestLiveMatchMetadata(key);
			 }, Math.random()*3000); 
		 }
		  
	  });
	  
	  //console.log(JSON.stringify(_this.liveMatches));
	  
	  //Take the first match that is currently LIVE - Should only be one according to the schedule
	  //this.liveMatchId = matches[0]['id'];  
	  //this.liveMatchScore = matches[0]['r'];

	  //this.requestLiveMatchMetadata();
  },
  
  requestLiveMatchMetadata: function(liveMatchId) {  
	    //console.log(new Date()+' - Making call to get data for '+liveMatchId)
	    var req = new XMLHttpRequest();
	    var stage = this.getCurrentStage();
	    //var stage = (curDate.getTime()>this.secondStageStartDate.getTime())?'255951':'255931'; 
	    req.open("GET", 'http://lup.fifa.com/live/common/competitions/worldcup/round='+stage+'/match='+liveMatchId+'/lang=en/channels/sentinel/liveblog.js', true);
	    req.onload = this.processLiveMatchMetadata.bind(this);
	    req.send(null);
  },
  
  processLiveMatchMetadata: function(e) {
	  var resp = e.target.responseText;
	  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
	  if(jsonText==='') {
		  return;
	  }
	  var liveObj = JSON.parse(jsonText);
	  var fragmentUrl = liveObj['fragment_url'];
	  this.requestLiveMatchInfo(fragmentUrl);
  },
  
  requestLiveMatchInfo: function(fragmentUrl) {  
	  var req = new XMLHttpRequest();
	  req.open("GET", fragmentUrl, true);
	  req.onload = this.processLiveMatchInfo.bind(this);
	  req.send(null);
  },
  
  processLiveMatchInfo: function(e) {
	  var _this = this;
	  
	  var resp = e.target.responseText;
	  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
	  if(jsonText==='') {
		  return;
	  }
	  var liveObj = JSON.parse(jsonText);
	  var title = liveObj['Name'];
	  title = title.substring(0, title.indexOf('['));
	  
	  var matchId = liveObj['Name'];
	  matchId = matchId.substring(matchId.indexOf(':')+1, matchId.indexOf(']'));
	  //console.log('Retrieved matchId : '+matchId);
	  
	  var posts = liveObj['Posts'];
	  
	  posts = $.grep(posts, function(o,i) {
		  return o['ExternalResourceType']==='MATCHEVENT' || o['ExternalResourceType']==='MOTM_WINNER';
	  });
	  
	  //console.log('Last Post was at '+this.lastPostTime+" - "+(new Date(this.lastPostTime)));
	  var postToShow = null, lastPostTime = _this.liveMatches[matchId]['lastPostTime'], liveMatchScore = _this.liveMatches[matchId]['liveMatchScore'];
	  var _this = this;
	  $.each(posts, function(i,p) {
		 var curTime = new Date(p['PostDate']).getTime();
		 //console.log(p['PostDate']+" - Comparing "+curTime+" to "+lastPostTime);
		 if(curTime>lastPostTime && postToShow==null) {
			 //console.log('Using this post to show - '+p['PostDate'] + " ("+curTime+") for matchId "+matchId);
			 //Get the latest post to show
			 postToShow = p;
			 _this.liveMatches[matchId]['lastPostTime'] = curTime;
			 return;
		 }
	  });
	  
	  if(postToShow!=null) {
		  msg = postToShow['Text'][0]['Text'];
		  this.notify(msg+'\n'+'Score : '+liveMatchScore, title, matchId);
	  }
  },  
  
  notify : function(msg, title, matchId) {
	  	var opt = {
			type: 'basic',
			iconUrl: 'fifa.png',
			title: '2014 FIFA World Cup Update',
			message: title+' - '+msg
	  	};
	  	chrome.notifications.create(matchId, opt, function(notifId) { 
	  		if(chrome.runtime.lastError) {
	  			console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
	  		}
	  	});
	  	
	    setTimeout(function(){
	    	chrome.notifications.clear(matchId, function() {
	    		if(chrome.runtime.lastError) {
	    			console.log(chrome.runtime.lastError);
	    		}
	    	});
	    }, 10000);
	    
	    this.tracker.sendEvent("Notification", "Match Event");
  },
  
  displayUninstallMessage : function() {
	  var opt = {
			type: 'basic',
			iconUrl: 'fifa.png',
			title: '2014 FIFA World Cup Update',
			message: 'Thank you very much for using the app.. I hope you enjoyed it. FIFA World Cup 2014 is now over.. Please uninstall the extension by right-clicking on the icon and choosing "Remove"'
	  	};
	  	chrome.notifications.create('uninstall', opt, function(notifId) { 
	  		if(chrome.runtime.lastError) {
	  			console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
	  		}
	  	});
  }
  
};

FifaWorldCup2014.init();
