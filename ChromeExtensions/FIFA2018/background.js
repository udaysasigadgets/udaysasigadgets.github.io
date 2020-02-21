var FifaWorldCup2018 = {

  matchesUrl: 'https://api.fifa.com/api/v1/calendar/matches?idseason=254645&idcompetition=17&language=en-GB&count=100',
  liveMatchesUrl: 'https://api.fifa.com/api/v1/live/football/now?language=en-GB',
  blogBaseUrl: 'https://livebloggingdistributionapi.fifa.com/api/v1/FIFA%20FORGE/en-GB/blogs?tag.IdMatch=',
  SEASON_CODE: "254645",
  tournmentEndDate: new Date(2018,6,15),
  lastPostTimeByMatch: {},
  
  service : null, 
  tracker: null,
  init : function() {
	  var _this = this;
	  try {
		  this.service = analytics.getService('FWC_2108_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-30');
		  this.tracker.sendAppView('MainView');
	  } catch(e) {
		  
	  }
	  
	  _this.requestOngoingMatchesInfo();
  },
  
  setHeader: function(xhr) {
      	xhr.setRequestHeader('authorization', "LiveBlogging key=1FBA2B07-6619-4BF3-9DE7-F93FFBDE076C");
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
	  
	  $.getJSON(this.liveMatchesUrl, function(resp) {
	  //$.getJSON(this.matchesUrl, function(resp) {
		  _this.processOngoingMatchesInfo(resp.Results);
	  });
  },
  
  processOngoingMatchesInfo: function(matches) {
	  var _this = this;
	  //console.log('Number of matches : '+ matches.length);
	  
	  var fifa2018Matches = $.grep(matches, function(match) {
		 return match.IdSeason===_this.SEASON_CODE; 
	  });
	  
	  /*
	  var fifa2018Matches = $.grep(matches, function(match) {
		 //return match.IdMatch==='300331503';
		 return match.MatchStatus===0;
	  });
	  */
	  
	  //console.log('Number of live matches : '+ fifa2018Matches.length);
	  
	  this.liveMatchesIdArr = $.map(fifa2018Matches, function(match) {
		 return match.IdMatch;
	  });
	  //console.log('this.liveMatchesIdArr : '+ this.liveMatchesIdArr);
	  
	  var postsToShow = [];
	  $.each(this.liveMatchesIdArr, function(i, matchId) {
		  
		  _this.lastPostTimeByMatch[matchId] = _this.lastPostTimeByMatch[matchId] || moment().subtract(1, 'months').valueOf();
		  $.ajax({
	          url: _this.blogBaseUrl+matchId,
	          type: 'GET',
	          dataType: 'json',
	          success: function(resp) {
	        	  //console.log(resp);
	        	  if(resp.items && resp.items.length>0) {
					  var item = resp.items[0];
					  var matchTitle = item.title.substring(0, item.title.indexOf('['));
					  matchTitle = matchTitle.substring(matchTitle.indexOf('-')+2);
					  var matchPostsUrl = item.postsUrl;
					  
					  $.ajax({
				          url: matchPostsUrl,
				          type: 'GET',
				          dataType: 'json',
				          success: function(postresp) { 
				        	  if(postresp.items && postresp.items.length>0) {
								  $.each(postresp.items, function(j, item) {
									  var matchEvents = $.grep(item.parts, function(part) {
										 return part.datasource==="MatchEvents" || part.datasource==="LivePosts"; 
									  });
									  $.each(matchEvents, function(k, part) {
										  if(moment(item.lastUpdateDate).valueOf()>_this.lastPostTimeByMatch[matchId]) {
											  var msg = '';
											  if(part.datasource==="LivePosts") {
												  msg = part.data.Text;
												  msg = msg.replace('<p>', '').replace('</p>', '');
											  } else if(part.datasource==="MatchEvents") {
												  msg = part.data.TranslatedEventName;
											  }
											  var postToShow = ({
									  				'matchId': matchId,
									  				'title': matchTitle.toUpperCase(),
									  				'message': msg,
									  				'time': moment(part.data.EventDateUTC).valueOf()
									  		  });
											  _this.notify(postToShow);
											  _this.speak(matchTitle+' '+msg);
											  _this.lastPostTimeByMatch[matchId] = moment(item.lastUpdateDate).valueOf();
											  console.log(matchId+' => '+moment(item.lastUpdateDate).valueOf());
										  }
									  });
								  });
							  }
				          },
				          error: function() { },
				          beforeSend: _this.setHeader
					  });
				  }
	          },
	          error: function() { },
	          beforeSend: _this.setHeader
		  });
		  
	  });
  },
  
  notify : function(post) {
		var pn = localStorage['fifa2018visual'];
		if (!pn) {
			pn = 'yes';
			localStorage['fifa2018visual'] = pn;
		}
		if (pn === 'no') {
			return;
		}

		var msg = post.message;
		var title = post.title;
		var time = post.time;
		var matchId = post.matchId;
		// console.log('Creating notification for '+matchId+' '+title+' '+msg);
		var opt = {
			type : 'basic',
			iconUrl : 'fifa.png',
			title : '2018 FIFA World Cup Update',
			message : title + ' - ' + msg + ' (' + moment(time).fromNow() + ')'
		};
		chrome.notifications.create(matchId, opt, function(notifId) {
			if (chrome.runtime.lastError) {
				console.log('NotifID ' + notifId + ' created - Last error:',
						chrome.runtime.lastError);
			}
		});

		setTimeout(function() {
			chrome.notifications.clear(matchId, function() {
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError);
				}
			});
		}, 10000);

		this.tracker.sendEvent("Notification", "Match Event");
  },
  
  speak : function(msg) {
	  var ps = localStorage['fifa2018audio'];
	  if(!ps) {
		  ps = 'no';
		  localStorage['fifa2018audio'] = ps;
	  }
	  if(ps==='no') {
		  return;
	  }
	  chrome.tts.speak(msg, {'voiceName': 'Google US English'});
	  this.tracker.sendEvent("Audio Notification", "Match Event");
  }
  
};

FifaWorldCup2018.init();
