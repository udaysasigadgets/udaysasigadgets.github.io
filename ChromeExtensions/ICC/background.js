
var IccWorldCup2015 = {

  matchesUrl: 'http://static.cricinfo.com/rss/livescores.xml',
  liveMatches: {},
  tournmentEndDate: new Date(2015,2,29),
  iccTournmentDoneMsgDate: (typeof localStorage['iccTournmentDoneMsgDate']==='undefined')?(new Date(2014,0,1)).getTime():localStorage['iccTournmentDoneMsgDate'],
  
  myTeams : null,
  myEvents : null,

  service : null, 
  tracker: null,
  init : function() {
	  var _this = this;
	  try {
		  this.service = analytics.getService('ICC_2105_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-33');
		  this.tracker.sendAppView('MainView');
	  } catch(e) {
		  
	  }
	  
	  var myEvents = localStorage['myEvents'];
      if(myEvents==null) {
        myEvents = ["FOUR", "SIX", "OUT"];
        localStorage['myEvents'] = myEvents;
      }
      var myTeams = localStorage['myTeams'];
      if(myTeams==null) {
        myTeams = ["England", "South Africa", "India", "Australia", "Sri Lanka", "Pakistan", "West Indies", "Bangladesh", "New Zealand", "Zimbabwe", "Ireland", "Afghanistan", "Scotland", "United Arab Emirates"];
        localStorage['myTeams'] = myTeams;
      }

	  _this.requestOngoingMatchesInfo();
  },
  
  requestOngoingMatchesInfo: function() {
	  var _this = this;
	  _this.myTeams = localStorage['myTeams'].split(',');
	  _this.myEvents = localStorage['myEvents'].split(',');

	  setTimeout(function() {
		  _this.requestOngoingMatchesInfo();
	  }, 15000);
	  
	  //Reset the ID Arr
	  this.liveMatchesIdArr = [];
	  
	  var curDate = new Date();
	  if(curDate.getTime() > this.tournmentEndDate.getTime()) {
		  //Do not show this message for another day
		  if(curDate.getTime()-parseInt(this.iccTournmentDoneMsgDate, 10)>1000*60*60*24) {
			  this.iccTournmentDoneMsgDate = curDate.getTime();
			  localStorage['iccTournmentDoneMsgDate'] = this.iccTournmentDoneMsgDate;
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
	  
	  	var resp = e.target.responseXML;
	  	var items = resp.getElementsByTagName("item");
	  	for (var i=0;i<items.length;i++) {
	   		var title = items[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;

	   		//Hack to get rid of county matches..
	   		var modifiedtitle = title.replace(/[0-9]/g, '').replace(/\//g,'').replace(/\*/g, '');
	   		var teams = modifiedtitle.split(' v ');

	   		if(_this.myTeams.indexOf(teams[0].trim())>-1 || _this.myTeams.indexOf(teams[1].trim())>-1) {
	   			var matchid = items[i].getElementsByTagName("guid")[0].childNodes[0].nodeValue;
				matchid = matchid.replace('http://www.cricinfo.com/ci/engine/match/','').replace('.html','');

				_this.liveMatchesIdArr.push(matchid);

				if(typeof _this.liveMatches[matchid]==='undefined') {
					//Object not present. Create one..
				  	_this.liveMatches[matchid] = {
				    	'liveMatchScore' : title,
				    	'lastPostInstant' : 0.0
				  	};
			  	} else {
				  	//Update the score
				  	_this.liveMatches[matchid]['liveMatchScore'] = title;
			  	}
	   		}
		}
		//console.log('Current matches live : '+_this.liveMatchesIdArr);

		//Cleanup task to keep the object count to a minimum - Otherwise will grow over time
	  	$.each(_this.liveMatches, function(key, value) {
		 	if(_this.liveMatchesIdArr.indexOf(key)===-1) {
			 	//No Longer Live
			 	//console.log('Match no longer Live - Deleting data for matchid '+key);
			 	delete _this.liveMatches[key];
		 	} else {
			 	//Still Live.. Make a call to get the latest match data
			 	window.setTimeout(function() {
					//console.log('Calling for detailed match data for match id '+key);
					_this.requestLiveMatchInfo(key);
			 	}, Math.random()*3000); 
		 	}
	  	});
	  	//console.log(JSON.stringify(_this.liveMatches));
  },

  requestLiveMatchInfo: function(liveMatchId) {  
	  var req = new XMLHttpRequest();
	  req.open("GET", 'http://www.espncricinfo.com/ci/engine/match/'+liveMatchId+'.json?xhr=1', true);
	  req.onload = this.processLiveMatchInfo.bind(this);
	  req.send(null);
  },
  
  processLiveMatchInfo: function(e) {
	  var _this = this;
	  
	  var matchId = e.target.responseURL;
	  matchId = matchId.replace('http://www.espncricinfo.com/ci/engine/match/','').replace('.json?xhr=1','');

	  var jsonText = e.target.responseText;
	  if(jsonText==='') {
		  return;
	  }
	  var liveObj = JSON.parse(jsonText);
	  var liveObjDesc = liveObj['description'];
	  var liveObjDate = liveObj['match']['present_datetime_gmt'];
	  //console.log(liveObjDesc+' received at '+liveObjDate);
	  
	  var comms = liveObj['comms'];
	  if(comms.length==0) {
	  	//No commentary found, Probably match not started yet
	  	return;
	  }

	  var posts = $.map(comms, function(c, i) {
	  	return c.ball;
	  });
	  //console.log('total posts : '+posts.length);
	  
	  //Filter posts according to user's notification preferences
	  posts = $.grep(posts, function(p, i) {
	  	var showPost = false;
	  	//To handle two events on the same ball
	  	if(!p['event']) {
	  		return false;
	  	}
	  	var currentEvents = p['event'].split(',');
	  	$.each(currentEvents, function(ii,vv) {
	  		if(_this.myEvents.indexOf(vv.trim())!=-1) {
	  			showPost = true;
	  		}
	  	});
	  	return showPost;
	  });
	  //console.log('Filtered posts : '+posts.length);
	  
	  var postToShow = null, lastPostInstant = _this.liveMatches[matchId]['lastPostInstant'], liveMatchScore = _this.liveMatches[matchId]['liveMatchScore'];
	  var _this = this;
	  $.each(posts, function(i,p) {
	  	 var overs = p["overs_actual"];
	  	 if(parseFloat(overs)<10) {
	  	 	overs = "0"+overs;
	  	 }
	  	 var currentPostInstant = parseFloat(p["innings_number"]+overs);
		 //console.log(">>> Comparing "+currentPostInstant+" to "+lastPostInstant);
		 if(currentPostInstant>lastPostInstant && postToShow==null) {
			 //Get the latest post to show
			 //console.log('Setting the postToShow to '+JSON.stringify(p));
			 postToShow = p;
			 _this.liveMatches[matchId]['lastPostInstant'] = currentPostInstant;
			 return;
		 }
	  });
	  
	  if(postToShow!=null) {
	  	  //console.log('One event available for notification');
	  	  var msg = '';
	  	  switch(postToShow.event) {
	  	  	case 'FOUR':
	  	  	case 'SIX' :
	  	  	case '1 run' :
	  	  	case '2 runs' :
	  	  	case '3 runs' :
	  	  	case '1 wide' :
	  	  	case '2 wides' :
	  	  	case '3 wides' :
	  	  	case '4 wides' :
	  	  	case '5 wides' :
	  	  	case '1 no ball' :
	  	  	case '1 leg bye' :
	  	  	case '2 leg byes' :
	  	  	case '3 leg byes' :
	  	  	case '4 leg byes' :
	  	  		msg = 'Over '+postToShow['overs_actual']+' : '+postToShow['players']+' - '+postToShow['event']+(postToShow['text']==''?'':' - ')+postToShow['text'];
	  	  		break;
	  	  	case 'OUT':
	  	  		msg = postToShow['dismissal']+'\n'+'Over '+postToShow['overs_actual']+' : '+postToShow['players']+' - '+postToShow['event']+(postToShow['text']==''?'':' - ')+postToShow['text'];
	  	  		break;	
	  	  }
		  this.notify(msg+'\n'+'Score : '+liveMatchScore, liveMatchScore, matchId);
	  }
  },  
  
  notify : function(msg, notifTitle, matchId) {
	  	var opt = {
			type: 'basic',
			iconUrl: 'icc128.png',
			title: 'ICC World Cup 2015 Update',
			message: msg,
			isClickable: true
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
	    }, 20000);
	    
	    this.tracker.sendEvent("Notification", "Match Event");
  },
  
  displayUninstallMessage : function() {
	  	var opt = {
			type: 'basic',
			iconUrl: 'icc128.png',
			title: 'ICC World Cup 2015 Update',
			message: 'ICC Cricket World Cup 2015 is now over.. Please take a moment to provide feedback by clicking on the Extension icon.'
	  	};
	  	chrome.notifications.create('uninstall', opt, function(notifId) { 
	  		if(chrome.runtime.lastError) {
	  			console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
	  		}
	  	});
	  	this.tracker.sendEvent("Notification", "Uninstall Event");
  }
  
};

IccWorldCup2015.init();
