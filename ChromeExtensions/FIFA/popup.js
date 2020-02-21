var FifaWorldCup2014 = {

  matchesUrl: 'http://lup.fifa.com/live/common/competitions/worldcup/_feed/_listmachlive.js',
  //liveMatchId: null,
  //nextMatchId: null,
  //nextMatchTime: null,
  //lastMatchId: null,
  //liveMatchScore: null,
  
  lastMatches: {},
  liveMatches: {},
  nextMatches: {},
  
  specialVenueMatches: ['300186511', '300186483', '300186457', '300186482'],
  
  tournmentEndDate: new Date(2014,6,14),
  secondStageStartDate: new Date(2014,5,28),
  quarterFinalsStartDate: new Date(2014,6,4),
  semiFinalsStartDate: new Date(2014,6,8),
  thirdPlaceMatchStartDate: new Date(2014,6,12),
  finalMatchStartDate:  new Date(2014,6,13),
  
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
	  
	  $("#noMatchSummary").empty();
	  
	  var curDate = new Date();
	  if(curDate.getTime() > this.tournmentEndDate.getTime()) {
		  window.setTimeout(function() {
			  var message = 'Thank you very much for using the app.. I hope you enjoyed it as much as I did. <br><br>FIFA World Cup 2014 is now over.. Please uninstall the extension by right-clicking on the icon and choosing "Remove". <br><br>I write apps for fun, I would really like to know what you thought about the app.. <br><br><a href="https://docs.google.com/forms/d/1Nc4TybHKgzY_t1xifQKMDAHJNPWGybiXvRbZtft0eJQ/viewform" target="share">Submit Feedback</a>';
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
	  
	  var resp = e.target.responseText;
	  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
	  if(jsonText==='') {
		  return;
	  }
	  var ongoingObj = JSON.parse(jsonText);
	  var matches = ongoingObj['matches'];
	  //console.log('Number of matches :'+matches.length);
	  var livematches = $.grep(matches, function(o,i) {
		  return o['s']==='live';
	  });
	  
	  var upcomingmatches = $.grep(matches, function(o,i) {
		  return o['s']==='fixture';
	  });
	  
	  var completedmatches = $.grep(matches, function(o,i) {
		  return o['s']==='result';
	  });
	  
	  upcomingmatches = upcomingmatches.sort(function(a,b) {
		  if(new Date(a["dt"]).getTime()>new Date(b["dt"]).getTime()) {
			  return 1;
		  } else if(new Date(a["dt"]).getTime()<new Date(b["dt"]).getTime()) {
			  return -1;
		  } else {
			  return 0;
		  }
	  });
	  
	  completedmatches = completedmatches.sort(function(a,b) {
		  if(new Date(a["dt"]).getTime()>new Date(b["dt"]).getTime()) {
			  return -1;
		  } else if(new Date(a["dt"]).getTime()<new Date(b["dt"]).getTime()) {
			  return 1;
		  } else {
			  return 0;
		  }
	  });
	  
	  if(upcomingmatches.length!==0) {
		  $.each(upcomingmatches, function(i,match) {
			 _this.nextMatches[match['id']] = {
					 'nextMatchTime' : match['dt']
			 };
			 
			 _this.requestNextMatchMetadata(match['id']);
		  });
		  /*
		  this.nextMatchId = upcomingmatches[0]['id'];
		  this.nextMatchTime = upcomingmatches[0]['dt'];
		  */
	  }
	  
	  /*
	  this.nextMatchId = '300186477';
	  this.nextMatchTime = '2014-06-15T19:00:00';
	  */
	  if(completedmatches.length!==0) {
		  $.each(completedmatches, function(i,match) {
			 _this.lastMatches[match['id']] = {
					 'lastMatchScore' : match['r'],
					 'lastMatchMin' : match['min']==='fifa.full-time'?'Full Time':match['min']
			 };
			 
			 _this.requestLastMatchMetadata(match['id']);
		  });
		  /*
		  this.lastMatchId = completedmatches[0]['id'];
		  this.lastMatchScore = completedmatches[0]['r'];
		  this.lastMatchMin = completedmatches[0]['min']==='fifa.full-time'?'Full Time':completedmatches[0]['min'];
		  */
	  }
	  
	  //console.log('Number of live matches :'+livematches.length);
	  //console.log('Number of upcoming matches :'+upcomingmatches.length);
	  
	  if(livematches.length!==0) {
		  $.each(livematches, function(i,match) {
			 _this.liveMatches[match['id']] = {
					 'lastMatchScore' : match['r'],
					 'lastMatchMin' : match['min']==='fifa.half-time'?'Half Time':match['min']
			 };
			 console.log('Added '+match['id']+' to the Map');
			 _this.requestLiveMatchMetadata(match['id']);
		  });
		  /*
		  //Take the first match that is currently LIVE - Should only be one according to the schedule
		  this.liveMatchId = livematches[0]['id'];
		  this.liveMatchScore = livematches[0]['r'];
		  this.liveMatchMin = livematches[0]['min']==='fifa.half-time'?'Half Time':livematches[0]['min'];
		  */
	  }
	  
	  /*
	  this.liveMatchId = '300186471';
	  this.liveMatchScore = '3-0';
	  this.liveMatchMin = "67'";
	  */
	  
	  /*
	  if(this.lastMatchId!=null) {
		  this.requestLastMatchMetadata();
	  }
	  if(this.liveMatchId!=null) {
		  this.requestLiveMatchMetadata();
	  }
	  if(this.nextMatchId!=null) {
		  this.requestNextMatchMetadata();
	  }
	  */
	  if(upcomingmatches.length===0) {
		  $("#noMatchSummary").removeClass("hide");
	  }
	  
  },
  
  requestLiveMatchMetadata: function(matchId) {  
	    var req = new XMLHttpRequest();
	    var stage = this.getCurrentStage();
	    //var stage = (curDate.getTime()>this.secondStageStartDate.getTime())?'255951':'255931';
	    //var matchId = this.liveMatchId;
	    req.open("GET", 'http://lup.fifa.com/live/common/competitions/worldcup/round='+stage+'/match='+matchId+'/lang=en/channels/sentinel/liveblog.js', true);
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
	  title = title.replace("FWC 2014 - ", "");
	  
	  var matchId = liveObj['Name'];
	  matchId = matchId.substring(matchId.indexOf(':')+1, matchId.indexOf(']'));
	  
	  console.log(JSON.stringify(_this.liveMatches));
	  var liveMatchMin = _this.liveMatches[matchId]['lastMatchMin'];
	  var liveMatchScore = _this.liveMatches[matchId]['lastMatchScore'];
	  
	  $("#liveMatchSummary").removeClass("hide").append("<span style='float:left'>Live Score</span><span style='float:right'>Match Clock : "+liveMatchMin+"</span><br><span style='font-size:18px;'>"+title+"<br>"+liveMatchScore+"</span><br>");
	  
  },
  
  /* Next Match Information */
  
  requestNextMatchMetadata: function(matchId) {  
	    var req = new XMLHttpRequest();
	    var stage = this.getCurrentStage();
	    //var stage = (curDate.getTime()>this.secondStageStartDate.getTime())?'255951':'255931';
	    //var matchId = this.nextMatchId;
	    req.open("GET", 'http://lup.fifa.com/live/common/competitions/worldcup/round='+stage+'/match='+matchId+'/lang=en/channels/sentinel/liveblog.js', true);
	    req.onload = this.processNextMatchMetadata.bind(this);
	    req.send(null);
	},
	
	processNextMatchMetadata: function(e) {
		  var resp = e.target.responseText;
		  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
		  if(jsonText==='') {
			  return;
		  }
		  var liveObj = JSON.parse(jsonText);
		  var fragmentUrl = liveObj['fragment_url'];
		  this.requestNextMatchInfo(fragmentUrl);
	},
	
	requestNextMatchInfo: function(fragmentUrl) {  
		  var req = new XMLHttpRequest();
		  req.open("GET", fragmentUrl, true);
		  req.onload = this.processNextMatchInfo.bind(this);
		  req.send(null);
	},
	
	processNextMatchInfo: function(e) {
		  var resp = e.target.responseText;
		  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
		  if(jsonText==='') {
			  return;
		  }
		  var nextObj = JSON.parse(jsonText);
		  var title = nextObj['Name'];
		  title = title.substring(0, title.indexOf('['));
		  title = title.replace("FWC 2014 - ", "");

		  var matchId = nextObj['Name'];
		  matchId = matchId.substring(matchId.indexOf(':')+1, matchId.indexOf(']'));
		  
		  var nextMatchStartTime = new Date(this.nextMatches[matchId]['nextMatchTime']);
		  if(this.specialVenueMatches.indexOf(matchId)!==-1) {
			  nextMatchStartTime.setHours(nextMatchStartTime.getHours()+4);  
		  } else {
			  nextMatchStartTime.setHours(nextMatchStartTime.getHours()+3);
		  }
		  
		  //console.log(nextMatchStartTime);
		  $("#upcomingMatchSummary").removeClass("hide").append("<span style='float:left'>Up Next</span><br><span style='font-size:18px'>"+title+"</span><br>"+this.humanFormat(nextMatchStartTime)+"<br>");
		  
	},

	/* Last Match Information */
	  
	requestLastMatchMetadata: function(matchId) {  
	    var req = new XMLHttpRequest();
	    var stage = this.getCurrentStage();
	    //var stage = (curDate.getTime()>this.secondStageStartDate.getTime())?'255951':'255931';
	    //var matchId = this.lastMatchId;
	    req.open("GET", 'http://lup.fifa.com/live/common/competitions/worldcup/round='+stage+'/match='+matchId+'/lang=en/channels/sentinel/liveblog.js', true);
	    req.onload = this.processLastMatchMetadata.bind(this);
	    req.send(null);
	},
	
	processLastMatchMetadata: function(e) {
		  var resp = e.target.responseText;
		  var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
		  if(jsonText==='') {
			  return;
		  }
		  var liveObj = JSON.parse(jsonText);
		  var fragmentUrl = liveObj['fragment_url'];
		  this.requestLastMatchInfo(fragmentUrl);
	},
	
	requestLastMatchInfo: function(fragmentUrl) {  
		  var req = new XMLHttpRequest();
		  req.open("GET", fragmentUrl, true);
		  req.onload = this.processLastMatchInfo.bind(this);
		  req.send(null);
	},
	
	processLastMatchInfo: function(e) {
		var _this = this;
		var resp = e.target.responseText;
		var jsonText = resp.substring(resp.indexOf("(")+1, resp.lastIndexOf(")"));
		if(jsonText==='') {
			return;
		}
		var lastObj = JSON.parse(jsonText);
		var title = lastObj['Name'];
		title = title.substring(0, title.indexOf('['));
		title = title.replace("FWC 2014 - ", "");
		  
		var matchId = lastObj['Name'];
		matchId = matchId.substring(matchId.indexOf(':')+1, matchId.indexOf(']'));
		  
		var lastMatchMin = _this.lastMatches[matchId]['lastMatchMin'];
		var lastMatchScore = _this.lastMatches[matchId]['lastMatchScore'];
		  
		$("#completedMatchSummary").removeClass("hide").append("<span style='float:left'>Completed</span><span style='float:right'>"+lastMatchMin+"</span><br><span style='font-size:18px;'>"+title+"<br>"+lastMatchScore+"</span><br>");
	},
	
	humanFormat: function(dateOne){
		var now = new Date();
		//console.log(now);
		var ms = dateOne.getTime()-now.getTime();
	    var x = ms / 1000;
	    seconds = parseInt(x % 60);
	    x /= 60;
	    minutes = parseInt(x % 60);
	    x /= 60;
	    hours = parseInt(x % 24);
	    x /= 24;
	    days = parseInt(x);

	    if(hours<0 || minutes<0 || seconds<0) {
	    	return ""
	    }
	    return hours + " hours " + minutes + " minutes " + seconds + " seconds to go";
	}
	
  
};

FifaWorldCup2014.requestOngoingMatchesInfo();
