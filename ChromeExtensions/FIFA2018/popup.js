var FifaWorldCup2018 = {

  matchesUrl: 'https://api.fifa.com/api/v1/calendar/matches?idseason=254645&idcompetition=17&language=en-GB&count=100',
  matchDetailUrl: 'https://api.fifa.com/api/v1/live/football/17/254645/IDSTAGE/IDMATCH?language=en-GB',
  
  lastMatches: [],
  liveMatches: [],
  nextMatches: [],
  
  tournmentEndDate: new Date(2018,6,15),
  
  init: function() {
	  var _this = this;
	  var changeCheckbox = $('#visual');
	  var pn = localStorage['fifa2018visual'];
	  if(!pn) {
		  pn = 'yes';
		  localStorage['fifa2018visual'] = pn;
	  }
	  if(pn && pn=='yes') {
		  $('#visual').addClass("selected");
	  } else {
		  $('#visual').removeClass("selected");
	  }
	  
	  var changeCheckbox2 = $('#audio');
	  var ps = localStorage['fifa2018audio'];
	  if(!ps) {
		  ps = 'no';
		  localStorage['fifa2018audio'] = ps;
	  }
	  if(ps && ps=='yes') {
		  $('#audio').addClass("selected");
	  } else {
		  $('#audio').removeClass("selected");
	  }

	  $(".mycheckbox").click(function() {
		  var elementid = $(this).attr("id");
		  var selected = $(this).hasClass("selected");
		  if(selected) {
			  localStorage['fifa2018'+elementid] = 'no';
		  } else {
			  localStorage['fifa2018'+elementid] = 'yes';
			  if(elementid==='audio') {
				  _this.speak('Audio notifications enabled');
			  } else if(elementid==='visual') {
				  _this.samplenotify();
			  }  
		  }  
		  $(this).toggleClass('selected');
	  });
	  
	  this.requestOngoingMatchesInfo();
  },
  
  requestOngoingMatchesInfo: function() {
	  var _this = this;

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
	  
	  $.getJSON(this.matchesUrl, function(resp) {
		  _this.processOngoingMatchesInfo(resp.Results);
	  });
	  
	  $(document).on('click', '.ongoing-summary', function() {
		 var matchId = $(this).attr('data-matchId');
		 window.open('https://www.fifa.com/worldcup/matches/match/'+matchId+'/#match-liveblog');
	  });
  },
  
  processOngoingMatchesInfo: function(matches) {
	  var _this = this;
	  console.log('Number of matches : '+ matches.length);
	  var completedMatches = $.grep(matches, function(match) {
		 return match.MatchStatus===0;
	  });
	  console.log('Number of completed matches : '+ completedMatches.length);
	  
	  var ongoingMatches = $.grep(matches, function(match) {
		 return match.MatchStatus===3;
	  });
	  console.log('Number of ongoing matches : '+ ongoingMatches.length);
	  
	  var upcomingMatches = $.grep(matches, function(match) {
		 return match.MatchStatus===1 || match.MatchStatus===12;
	  });
	  console.log('Number of upcoiming matches : '+ upcomingMatches.length);
	  
	  //Process completedMatches
	  if(completedMatches.length>0) {
		  var completedMatchToDisplay = completedMatches[completedMatches.length-1];
		  var homeTeam = completedMatchToDisplay.Home, awayTeam = completedMatchToDisplay.Away;
		  var winningTeam = completedMatchToDisplay.Winner;
		  var html = '<div class="summary">'
			  		+	'<div class="row">'
			  		+ 		'<div class="col-xs-5 '+((homeTeam['IdTeam']===winningTeam)?'strong':'')+'">'
			  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+homeTeam['IdCountry']+'">'+homeTeam['TeamName'][0]['Description']+'<br>'
		  			+			'<span class="score">'+homeTeam['Score']+'</span>'
		  			+		'</div>'
			  		+	 	'<div class="col-xs-2"><br>vs</div>'
			  		+ 		'<div class="col-xs-5 '+((awayTeam['IdTeam']===winningTeam)?'strong':'')+'">'
			  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+awayTeam['IdCountry']+'">'+awayTeam['TeamName'][0]['Description']+'<br>'
			  		+			'<span class="score">'+awayTeam['Score']+'</span>'
		  			+		'</div>'
		  			+	'</div>'
		  			+	'<div class="row">'
		  			+ 		'<div class="col-xs-12">'
		  			+			'<span class="footer-text">(Match ended already)</span>'
		  			+		'</div>'
			  		+	'</div>';
		  			+'</div>';
		  $("#completedMatchSummary").append(html).removeClass('hide');
	  }
	  
	  //Process ongoingMatches
	  if(ongoingMatches.length>0) {
		  $.each(ongoingMatches, function(i, ongoingMatchToQuery) {
			  var matchurl = _this.matchDetailUrl.replace("IDSTAGE", ongoingMatchToQuery["IdStage"]).replace("IDMATCH", ongoingMatchToQuery["IdMatch"]);
			  $.getJSON(matchurl, function(ongoingMatchToDisplay) {
				  var homeTeam = ongoingMatchToDisplay.HomeTeam, awayTeam = ongoingMatchToDisplay.AwayTeam;
				  var winningTeam = ongoingMatchToDisplay.Winner;
				  var html = '<div class="summary ongoing-summary pointer" data-matchId="'+ongoingMatchToDisplay['IdMatch']+'">'
					  		+	'<div class="row">'
					  		+ 		'<div class="col-xs-5 '+((homeTeam['IdTeam']===winningTeam)?'strong':'')+'">'
					  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+homeTeam['IdCountry']+'">'+homeTeam['TeamName'][0]['Description']+'<br>'
				  			+			'<span class="score">'+homeTeam['Score']+'</span>'
				  			+		'</div>'
					  		+	 	'<div class="col-xs-2"><br>vs</div>'
					  		+ 		'<div class="col-xs-5 '+((awayTeam['IdTeam']===winningTeam)?'strong':'')+'">'
					  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+awayTeam['IdCountry']+'">'+awayTeam['TeamName'][0]['Description']+'<br>'
					  		+			'<span class="score">'+awayTeam['Score']+'</span>'
				  			+		'</div>'
				  			+	'</div>'
				  			+	'<div class="row">'
				  			+ 		'<div class="col-xs-12">'
				  			+			'<div class="footer-text"><img src="loading.svg" width="25" class="pull-right">(Match time: '+(ongoingMatchToDisplay['MatchTime']||'Just started')+')</div>'
				  			+		'</div>'
					  		+	'</div>';
				  			+'</div>';
				  $("#completedMatchSummary").append(html).removeClass('hide');	  
			  });
		  });
		  
	  }
	  
	  //Process upcomingMatches
	  if(upcomingMatches.length>0) {
		  var upcomingMatchToDisplay = upcomingMatches[0];
		  var homeTeam = upcomingMatchToDisplay.Home, awayTeam = upcomingMatchToDisplay.Away;
		  var html = '<div class="summary">'
			  		+	'<div class="row">'
			  		+ 		'<div class="col-xs-5">'
			  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+homeTeam['IdCountry']+'">'+homeTeam['TeamName'][0]['Description']+'<br>'
		  			+		'</div>'
			  		+	 	'<div class="col-xs-2">vs</div>'
			  		+ 		'<div class="col-xs-5">'
			  		+			'<img class="small-flag" src="https://api.fifa.com/api/v1/picture/flags-fwc2018-3/'+awayTeam['IdCountry']+'">'+awayTeam['TeamName'][0]['Description']+'<br>'
		  			+		'</div>'
		  			+	'</div>'
		  			+	'<div class="row">'
		  			+ 		'<div class="col-xs-12">'
		  			+			'<span class="footer-text"><br>(Match starts '+moment(upcomingMatchToDisplay['Date']).fromNow()+')</span>'
		  			+		'</div>'
			  		+	'</div>';
		  			+'</div>';
		  $("#upcomingMatchSummary").append(html).removeClass('hide');
	  }
	  
  },
  
  speak : function(msg) {
	  chrome.tts.speak(msg, {'voiceName': 'Google US English'});
  },
  
  samplenotify : function() {
	    var opt = {
			type: 'basic',
			iconUrl: 'fifa.png',
			title: '2018 FIFA World Cup Update',
			message: 'Visual notifications enabled. You will start seeing notifications like these.'
	  	};
	  	chrome.notifications.create('samplenotify', opt, function(notifId) { 
	  		if(chrome.runtime.lastError) {
	  			console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
	  		}
	  	});
	  	
	    setTimeout(function(){
	    	chrome.notifications.clear('samplenotify', function() {
	    		if(chrome.runtime.lastError) {
	    			console.log(chrome.runtime.lastError);
	    		}
	    	});
	    }, 10000);
  }
  
};

FifaWorldCup2018.init();
