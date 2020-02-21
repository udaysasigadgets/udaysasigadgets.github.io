
var PowerUp = {

  chargepointUrl: 'https://na.chargepoint.com/dashboard/getChargeSpots',
  liveMatches: {},
  
  myTeams : null,
  myEvents : null,

  service : null, 
  tracker: null,
  notify: false,

  loggedInUser: null,
  cardSerialNumber: null,

  init : function() {
	  var _this = this;
	  /*
	  try {
		  this.service = analytics.getService('PowerUp_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-34');
		  this.tracker.sendAppView('MainView');
	  } catch(e) {
		  
	  }
	  */
	  
	  _this.requestChargingStationInfo();
  },
  
  requestChargingStationInfo: function() {
	  	var _this = this;
	  	
	  	var b, prefBounds = localStorage['b'];
      	if(prefBounds) {
      		b = JSON.parse(prefBounds);
	   		
	   		var obj = {};
            obj["station_list"] = {"screen_width": 1272, "screen_height":627, "ne_lat":b.ne.lat, "ne_lon":b.ne.lng, "sw_lat":b.sw.lat, "sw_lon":b.sw.lng, "page_size": 100,"page_offset":"","sort_by":"distance","user_lat":b.sw.lat,"user_lon":b.sw.lng,"include_map_bound":true };
            obj["station_list"]["filter"] = {"connector_l1":false,"connector_l2":true,"is_bmw_dc_program":false,"is_nctc_program":false,"connector_chademo":true,"connector_combo":false,"connector_tesla":false,"price_free":false,"status_available":false,"network_chargepoint":false,"network_blink":false,"network_semacharge":false,"network_evgo":false};
            obj["user_id"] = localStorage['cu']?parseInt(localStorage['cu']):'';

            _this.chargepointUrl = "https://mc.chargepoint.com/map-prod/get?"+JSON.stringify(obj);					
       		//_this.chargepointUrl = 'https://na.chargepoint.com/dashboard/getChargeSpots?ne_lat='+bounds['ne']['lat']+'&ne_lng='+bounds['ne']['lng']+'&sw_lat='+bounds['sw']['lat']+'&sw_lng='+bounds['sw']['lng'];
      	} else {
      		return;
      	}
	  	setTimeout(function() {
			_this.requestChargingStationInfo();
	  	}, 15000);
	  
	  	var req = new XMLHttpRequest();
	  	req.open("GET", this.chargepointUrl, true);
	  	req.onload = this.processChargingStationInfo.bind(this);
	  	req.send(null);
  },
  
  processChargingStationInfo: function(e) {
		var _this = this;
		var pn = localStorage['pn'];
		var ps = localStorage['ps'];
	
		var resp = JSON.parse(e.target.response);

		if(localStorage['ce']!=null && localStorage['cp']!=null && localStorage['ce']!='' && localStorage['cp']!='') {
			//User has login credentials present, Login the user
			var data = {"user_name": localStorage['ce'], "user_password": localStorage['cp']};
			$.post("https://na.chargepoint.com/users/validate", data, function(response) {
							response = JSON.parse(response);
							if(response && response.userid) {
								//console.log('Writing User ID to local storage : '+response.userid);
								localStorage['cu'] = response.userid;
								_this.loggedInUser = true;
							}
					});
		} else {
			_this.loggedInUser = true;
		}
		if(_this.cardSerialNumber==null) {
			_this.captureChargingCardDetails();
		}

		var waitlistEnabled = true;
		if(!waitlistEnabled) {
	  	//If Login fails, continue fetching station info as guest - Remember: Notifications work for guest too
	  	var numAvailableStations = 0;
	  	var stations = resp["station_list"]["summaries"];
	  	$.each(stations, function(i, station) {
	  		//console.log(i+') '+station['station_status']+ ' => '+ station["station_name"].join(' '));
	  		if(station['station_status']=='available' || station['station_status']=='available_dc') {
	  			numAvailableStations++;
	  			//console.log('Found a station available');

				var address = [];
				$.map(station["address"], function(value, key) {
					address.push(value);
				});
				var msg = 'Charging Station '+station["station_name"].join(' ')+' is now available at '+address.join(', ');
				//console.log(msg);

				//Notify the user if notifications is turned on
				if(pn && pn=='true') {
		  			var notifTitle = 'Charging Station Available';
			  		_this.notify('powerup128.png', msg, notifTitle, 'powerup'+station['device_id']);
			  	}
			  	if(ps && ps=='true') {
			  		_this.speak(msg);
			  	}
	  		}
	  	});

	  	if(numAvailableStations>0) {
	  		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
				chrome.browserAction.setBadgeText({text: ''+numAvailableStations});
				chrome.browserAction.setIcon({path:'powerup38.png'});
			} else {
				chrome.browserAction.setIcon({path:'powerup38.png'});
				chrome.browserAction.setBadgeText({text: ''});
			}
		
		} else {
			_this.captureWaitlistDetails();
		} 

		_this.captureChargingInfo();
  },

	captureWaitlistDetails : function() {
		var _this = this;
		var pn = localStorage['pn'];
  	var ps = localStorage['ps'];
		$.post("https://nissan.chargepoint.com/community/get_charging_info", {}, function(response) {
			response = JSON.parse(response);
			if(response && response.response && response.response.message) {
				var queuseState = response.response.message.subscriberQueueState;
				var token = response.response.message.token;
				if(queuseState==='ACCEPT_PENDING') {
					//Your turn to charge
					var msg = 'PowerUp - You are next !! Its your turn to charge your vehicle!!!';

					if(pn && pn=='true') {
		  			var notifTitle = 'You are next !!!';
			  		_this.notify('powerup128.png', msg, notifTitle, 'powerup');
			  	}
			  	if(ps && ps=='true') {
			  		_this.speak(msg);
			  	}
					
				} else if(queuseState==='ACCEPT_PENDING') {
					//Plugin Pending
					$.post("https://nissan.chargepoint.com/community/get_notification_detail/"+token, {}, function(response) {
						response = JSON.parse(response);
						if(response && response.response) {
							var deviceFullAddress = response.response.deviceFullAddress;
							var deviceName = response.response.deviceName;
							var acceptTime = response.response.epochLastUpdatedTime*1000;
							var allowedPluginTime = parseInt(response.response.PortQueueConfigPlugInTime, 10)*1000;
							var timeToGo = moment(acceptTime+allowedPluginTime).toNow();
							var msg = 'PowerUp - You have to plugin your vehicle '+timeToGo +' at station '+deviceName +' located at '+deviceFullAddress;

							if(pn && pn=='true') {
								var notifTitle = 'Plugin your car !!!';
								_this.notify('powerup128.png', msg, notifTitle, 'powerup');
							}
							if(ps && ps=='true') {
								_this.speak(msg);
							}
						}
					});
				} /*else if(queuseState==='CHARGING') {
					var deviceFullAddress = response.response.message.deviceFullAddress;
					var deviceName = response.response.message.deviceName;
					var pluginTime = parseInt(response.response.message.pluginEpochTime, 10);
					var allowedChargingTime = parseInt(response.response.message.PortQueueConfigMaxChargingTime, 10)*1000;
					var timeToGo = moment(pluginTime+allowedChargingTime).fromNow();
					var msg = 'PowerUp - You have to plug out your vehicle '+timeToGo +' from station '+deviceName;

					if(pn && pn=='true') {
						var notifTitle = 'Plug-out your car';
						_this.notify('powerup128.png', msg, notifTitle, 'powerup');
					}
					if(ps && ps=='true') {
						_this.speak(msg);
					}
				}*/
			}
		});
	},
	
  captureChargingCardDetails : function() {
  		var _this = this;
	  	if(_this.loggedInUser==null) {
	  		return;
	  	}
  		$.post("https://nissan.chargepoint.com/dashboard/getUsersCardList", {"isAjax": true}, function(response) {
  			response = JSON.parse(response);
  			if(response && response.content && response.content.length>0 && response.content[0] && response.content[0]['serial_number']) {
	  			_this.cardSerialNumber = response.content[0]['serial_number'];
	  		}
		});
  },

  captureChargingInfo : function() {
  		var _this = this;
  		if(_this.cardSerialNumber==null) {
  			return;
  		}
  		$.post("https://nissan.chargepoint.com/dashboard/getRealTimeStatusGraph", {'serialNumber': _this.cardSerialNumber}, function(response) {
  			response = JSON.parse(response);
  			if(response && response['content'] && response['content']['graph_data'].length>0 && response['content']['graph_data'][0]) {
				var dataobj = response['content']['graph_data'][0];
  				var power = dataobj['power'];
	  			if(power<0.5) {
	  				var pn = localStorage['pn'];
	  				var ps = localStorage['ps'];
	  				//Notify the user if notifications is turned on
	  				var notifTitle = 'Charging almost complete';
			  		var msg = 'Your vehicle plugged in at '+dataobj['address']+' may be fully charged';
					//if(pn && pn=='true') { //Show visual notification regardless of setting
				  	_this.notify('powerup128.png', msg+' (Currently drawing only '+power+' kW)', notifTitle, 'powerup'+dataobj['id']);
				  	//}
				  	//Audio notification only if enabled
				  	if(ps && ps=='true') {
				  		_this.speak(msg);
				  	}
	  			}
  			}
		});
  },

  notify : function(img, msg, notifTitle, stationId) {
  		var opt = {
			type: 'basic',
			iconUrl: img,
			title: notifTitle,
			message: msg,
			isClickable: true
	  	};
	  	chrome.notifications.create(stationId, opt, function(notifId) { 
	  		if(chrome.runtime.lastError) {
	  			console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
	  		}
	  	});
	  	
	    setTimeout(function(){
	    	chrome.notifications.clear(stationId, function() {
	    		if(chrome.runtime.lastError) {
	    			console.log(chrome.runtime.lastError);
	    		}
	    	});
	    }, 10000);
  }, 

  speak : function(msg) {
	    chrome.tts.speak(msg, {'voiceName': 'Google US English'});
  }
  
};

PowerUp.init();
