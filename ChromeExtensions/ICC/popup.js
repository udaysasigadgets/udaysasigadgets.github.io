var IccWorldCup2015 = {

  matchesUrl: 'http://static.cricinfo.com/rss/livescores.xml',
  liveMatches: {},
  tournmentEndDate: new Date(2015,2,29),
  
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
		  this.tracker.sendAppView('PopupView');
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
	  
	  var curDate = new Date();
	  if(curDate.getTime() > this.tournmentEndDate.getTime()) {
		  window.setTimeout(function() {
			  var message = 'ICC World Cup 2015 is now over.. If you wish to use this app for any ongoing test, one-day and t20 matches (including IPL), please click <a href="https://chrome.google.com/webstore/detail/cricket-live-notification/ipaloicnjcpbhbbdffpbfgnabnmniikk" target="extension" style="color:blue">here</a> to download the extension. <br><br>You can uninstall this extension by right-clicking on the icon and choosing "Remove". <br><br>I write apps for fun, I would really like to know if this app was useful to you.. <br><br><a href="https://docs.google.com/forms/d/1IFwaejc3GHHOKwcHvaXarjnRlwxT4m1h18GPGGUajvY/viewform" target="share" style="color:blue">Submit Feedback</a>';
			  $("#noMatchSummary").html(message).css({"text-align": "left"}).removeClass("hide");
		  }, 200);
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
	  	var recentmatches = [];

	  	for (var i=0;i<items.length;i++) {
	   		var title = items[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;

	   		//Hack to get rid of county matches..
	   		var modifiedtitle = title.replace(/[0-9]/g, '').replace(/\//g,'').replace(/\*/g, '');
	   		var teams = modifiedtitle.split(' v ');
	   		
	   		if(_this.myTeams.indexOf(teams[0].trim())>-1 || _this.myTeams.indexOf(teams[1].trim())>-1) {
	   			var matchid = items[i].getElementsByTagName("guid")[0].childNodes[0].nodeValue;
				matchid = matchid.replace('http://www.cricinfo.com/ci/engine/match/','').replace('.html','');

	   			recentmatches.push({
	   				'id': matchid,
	   				'title': title
	   			});
	   		}
		}
				
	  	if(recentmatches.length===0) {
			$("#noMatchSummary").removeClass("hide");
	  	} else {
	  		for(var i=0;i<recentmatches.length-1;i++) {
	  			$("#liveMatchSummary").removeClass("hide").append("<span id='match_"+recentmatches[i].id+"' style='font-size:14px;white-space: nowrap;'>"+recentmatches[i].title+"</span><hr>");
	  			this.requestLiveMatchInfo(recentmatches[i].id);
	  		}
	  		$("#liveMatchSummary").removeClass("hide").append("<span id='match_"+recentmatches[recentmatches.length-1].id+"' style='font-size:14px;white-space: nowrap;'>"+recentmatches[recentmatches.length-1].title+"</span>");
	  		this.requestLiveMatchInfo(recentmatches[recentmatches.length-1].id);
	  	}
	  
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
	  var liveObjCountdown = liveObj['match']['match_minute_countdown'];
	  var additionalMsg = '';
	  if(!isNaN(liveObjCountdown) && parseInt(liveObjCountdown)<0) {
	  	liveObjCountdown = liveObjCountdown*-1;
	  	additionalMsg = 'Match starts in '+this.humanFormat(liveObjCountdown)+' min';
	  } else {
	  	//Check if first innings is going on
	  	var firstInnings = false, overs = '', nrr = '';
	  	var currentInnings = $.each(liveObj['innings'], function(i, innings) {
	  		if(innings['live_current_name'] && innings['live_current_name']=='current innings' && innings['innings_number']=='1') {
	  			firstInnings = true;
	  			overs = innings['overs'];
	  			nrr = innings['run_rate'];
	  		}
	  	});
	  	if(firstInnings) {
	  		//First Innings message
	  		additionalMsg = 'Overs : '+overs+', Run Rate : '+nrr;
	  	} else {
	  		//Second innings
	  		var liveStatus = liveObj['live']['status'];
	  		additionalMsg = liveStatus;
	  	}
	  	
	  }
	  
	  $("#match_"+matchId).append('<br><span style="font-size:10px;">'+additionalMsg+'</span>')

  }, 

	humanFormat: function(x){
	    minutes = parseInt(x % 60);
	    x /= 60;
	    hours = parseInt(x % 24);
	    x /= 24;
	    days = parseInt(x);

	    if(hours<0 || minutes<0) {
	    	return ""
	    }
	    return hours + " hour"+(hours==1?'':'s')+' ' + minutes + " minute"+(minutes==1?'':'s');
	}
	
  
};

IccWorldCup2015.init();
