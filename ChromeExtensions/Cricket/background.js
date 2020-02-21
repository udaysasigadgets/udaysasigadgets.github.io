
var Cricket = {

  matchesUrl: 'http://static.cricinfo.com/rss/livescores.xml',
  liveMatches: {},
  
  myTeams : null,
  myEvents : null,

  service : null, 
  tracker: null,
  init : function() {
	  var _this = this;
	  try {
		  this.service = analytics.getService('Cricket_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-34');
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
        myTeams = ["England", "South Africa", "India", "Australia", "Sri Lanka", "Pakistan", "West Indies", "Bangladesh", "New Zealand", "Zimbabwe", "Ireland", "Afghanistan", "Scotland", "United Arab Emirates",
        "Mumbai Indians", "Rajasthan Royals", "Chennai Super Kings", "Kolkata Knight Riders", "Kings XI Punjab", "Sunrisers Hyderabad", "Royal Challengers Bangalore", "Delhi Daredevils"];
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

	   		//Get rid of the scores and * characters to leave the data in "TeamA v TeamB" format
			//var modifiedtitle = title.replace(/[0-9]/g, '').replace(/\//g,'').replace(/\*/g, '').replace(/&/g, '');
			var modifiedtitle = title.replace(/&/g, '').replace(/\//g,'').replace(/\*/g,'').replace(/\b\d+\b/g, "");;
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
	  
	  //Summary information
	  var summaryHtml = '';
	  if(liveObj['innings'].length>0) {
		  var teammap = {};

		  //Ongoing match
		  $.each(liveObj['innings'], function(i, innings) {
			var teamname = _this.getTeamName(liveObj, innings['batting_team_id']);
			teammap[teamname] = teammap[teamname] || [];
			
			var score = ''
			if(innings['runs']!=0 || innings['wickets']!=0) {
				score += ' '+innings['runs']+'/'+innings['wickets'];
			}
			if(liveObj['match'].winner_team_id=="0" && innings['live_current_name'] && innings['live_current_name']==='current innings') {
				score += '*';
			}
			teammap[teamname].push(score);
		  });
		  $.each(teammap, function(teamname, scores) {
			  if(summaryHtml.length>0) {
				summaryHtml += ' vs ';
			  }
			  summaryHtml += teamname + ' ' + scores.join(' & ');
		  });
	  } else {
		  summaryHtml += liveObj['match']['team1_name'] +' vs ' + liveObj['match']['team2_name']; 
	  }
	  
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
	  
	  var postToShow = null, lastPostInstant = _this.liveMatches[matchId]['lastPostInstant'], liveMatchScore = summaryHtml;
	  var _this = this;
	  $.each(posts, function(i,p) {
	  	 var overs = p["overs_actual"];
	  	 
	  	 if(parseFloat(overs)<10) {
	  	 	overs = "00"+overs;
	  	 } else if(parseFloat(overs)<100) {
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
	  	  var msg = '', img = '';
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
	  	  switch(postToShow.event) {
	  	  	case 'FOUR':
	  	  		img = '4.png';
	  	  		break;
	  	  	case 'SIX' :
	  	  		img = '6.png';
	  	  		break;	
	  	  	case '1 run' :
	  	  	case '2 runs' :
	  	  	case '3 runs' :
	  	  		img = 'cricket128.png';
	  	  		break;
	  	  	case '1 wide' :
	  	  	case '2 wides' :
	  	  	case '3 wides' :
	  	  	case '4 wides' :
	  	  	case '5 wides' :
	  	  		img = 'wide.png';
	  	  		break;
	  	  	case '1 no ball' :
	  	  		img = 'NB.png';
	  	  		break;
	  	  	case '1 leg bye' :
	  	  	case '2 leg byes' :
	  	  	case '3 leg byes' :
	  	  	case '4 leg byes' :
	  	  		img = 'LB.png';
	  	  		break;
	  	  	case 'OUT':
	  	  		img = 'W.png';
	  	  		break;
	  	  }
		  this.notify(img, msg+'\n'+'Score : '+liveMatchScore, liveMatchScore, matchId);
	  }
  },  
  
  notify : function(img, msg, notifTitle, matchId) {
	  	//Sanitize message
	    msg = msg.replace('<b>', '').replace('</b>', '').replace('<B>', '').replace('</B>', '');
	    msg = msg.replace('<i>', '').replace('</i>', '').replace('<I>', '').replace('</I>', '');
	  	var opt = {
			type: 'basic',
			iconUrl: img,
			title: notifTitle,
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
  
  getTeamName: function(response, teamid) {
	  var teamname = 'N/A';
	  $.each(response.series, function(i, s) {
		  $.each(s.teams, function(j, t) {
			 if(t.team_id===teamid) {
				 teamname = t.team_short_name;
			 } 
		  });
	  });
	  return teamname;
  }
  
};

Cricket.init();
