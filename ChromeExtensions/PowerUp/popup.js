var PowerUp = {

  chargepointUrl: 'https://na.chargepoint.com/dashboard/getChargeSpots',
  liveMatches: {},
  
  myTeams : null,
  myEvents : null,

  service : null, 
  tracker: null,
  loggedInUser: null,
  cardSerialNumber: null,

  init : function() {
	  var _this = this;
	  /*
	  try {
		  this.service = analytics.getService('Cricket_Live_Updates');
		  this.service.getConfig().addCallback(function() {
			  //console.log('analytics service created');
		  });
		  this.tracker = this.service.getTracker('UA-1214589-34');
		  this.tracker.sendAppView('PopupView');
	  } catch(e) {
		  
	  }
	  */
	  _this.requestChargingStationInfo();
	  
	  var changeCheckbox = document.querySelector('.js-switch');
	  var pn = localStorage['pn'];
	  if(pn && pn=='true') {
	  	$('.js-switch').prop('checked', true);
	  }
	  var switcheryObj = new Switchery(changeCheckbox, {size: 'small', secondaryColor: '#CCCCCC', jackColor: '#489E07', jackSecondaryColor: '#CCCCCC'});

	  changeCheckbox.onchange = function() {
	  	localStorage['pn'] = ''+changeCheckbox.checked;
	  	console.log('New value of checkbox : '+localStorage['pn']);
	  };

	  var changeCheckbox2 = document.querySelector('.js-switch2');
	  var ps = localStorage['ps'];
	  if(ps && ps=='true') {
	  	$('.js-switch2').prop('checked', true);
	  }
	  var switcheryObj2 = new Switchery(changeCheckbox2, {size: 'small', secondaryColor: '#CCCCCC', jackColor: '#489E07', jackSecondaryColor: '#CCCCCC'});

	  changeCheckbox2.onchange = function() {
	  	localStorage['ps'] = ''+changeCheckbox2.checked;
	  	console.log('New value of checkbox : '+localStorage['ps']);
	  };

  },
  
  requestChargingStationInfo: function() {
	 	var _this = this;

	  	var b, prefBounds = localStorage['b'];
	  	if(prefBounds) {
	   		b = JSON.parse(prefBounds);
	   		/*
	   		_this.chargepointUrl = 'https://na.chargepoint.com/dashboard/getChargeSpots?ne_lat='+bounds['ne']['lat']+'&ne_lng='+bounds['ne']['lng']+'&sw_lat='+bounds['sw']['lat']+'&sw_lng='+bounds['sw']['lng']
	   								+'&f_chademo=true'
	   								+'&f_free=true'
	   								+'&f_l2=true'
	   								+'&f_l3=true';
	   		*/
	   		
	   		//Load all the charging stations on the map
            var obj = {};
            obj["station_list"] = {"screen_width": 1272, "screen_height":627, "ne_lat":b.ne.lat, "ne_lon":b.ne.lng, "sw_lat":b.sw.lat, "sw_lon":b.sw.lng, "page_size": 100,"page_offset":"","sort_by":"distance","user_lat":b.sw.lat,"user_lon":b.sw.lng,"include_map_bound":true };
            obj["station_list"]["filter"] = {"connector_l1":false,"connector_l2":true,"is_bmw_dc_program":false,"is_nctc_program":false,"connector_chademo":true,"connector_combo":false,"connector_tesla":false,"price_free":false,"status_available":false,"network_chargepoint":false,"network_blink":false,"network_semacharge":false,"network_evgo":false};
            obj["user_id"] = localStorage['cu']?parseInt(localStorage['cu']):'';
            _this.chargepointUrl = "https://mc.chargepoint.com/map-prod/get?"+JSON.stringify(obj);					
	  	} else {
	  		return;
	  	}
	  
	  	var req = new XMLHttpRequest();
	  	req.open("GET", this.chargepointUrl, true);
	  	req.onload = this.processChargingStationInfo.bind(this);
	  	req.send(null);
  },
	
	captureQueueDetailsDetails : function() {
		var _this = this;
		var pn = localStorage['pn'];
  	var ps = localStorage['ps'];
		$.post("https://nissan.chargepoint.com/community/getRegionQueues", {'page': 1, 'stationCount': 6}, function(response) {
			response = JSON.parse(response);
			if(response && response.response && response.response.message) {
				var regions = response.response.message.regions;
				var currentPositionInQueue = 999;
				$.each(regions, function(i, r) {
					if(r.portQueue) {
						$.each(r.portQueue, function(j, p) {
							currentPositionInQueue = Math.min(currentPositionInQueue, parseInt(p.position, 10));
						});
					}
				});

				if(currentPositionInQueue===999) {
					currentPositionInQueue = 'N/A'
				}
				console.log('Your current position in queue : '+currentPositionInQueue);
				$("#queue-position").text(currentPositionInQueue);
			}
		});
	},

  processChargingStationInfo: function(e) {
  		var _this = this;
		
	  	var resp = JSON.parse(e.target.response);
	  	_this.captureChargingCardDetails();
	  	/*
		if(resp[0]["user_info"]["is_guest"]==0) {
			_this.loggedInUser = true;
			_this.captureChargingCardDetails();
		}
		*/

	  	var numAvailableStations = 0;
	  	var stations = resp["station_list"]["summaries"];
	  	$("#availableStations").empty();
	  	$.each(stations, function(i, station) {
	  		console.log(i+') '+station['station_status']+ ' => '+ station["station_name"].join(' '));
	  		if(station['station_status']=='available' || station['station_status']=='available_dc') {
	  			numAvailableStations++;
	  			console.log('Found a station available');

	  			var address = [];
	  			/*
	  			$.map(station["address"], function(value, key) {
	  				address.push(value);
	  			});
				*/
				address.push(station["address"]["address1"]);
                address.push(station["address"]["city"]);
                address.push(station["address"]["state_name"]);
	  			var msg = 'Charging Station '+station["station_name"].join(' ')+' is now available at '+address.join(', ');
	  			console.log(msg);
	  			var notifTitle = 'Charging Station Available';
	  			//_this.notify('powerup128.png', msg, notifTitle, 'powerup'+station['device_id']);

	  			_this.appendChargingStationInfo(station);
	  		}
	  	});

	  	if(numAvailableStations==0) {
	  		$("#availableStations").append('<div class="no-stations-available-msg">No stations available matching your location. Please <a href="options.html" target="options">change your location preferences</a> to find an available charging point</div>');
			} 
			_this.captureQueueDetailsDetails();
  },

  appendChargingStationInfo : function(station) {
  		var address = [];
  		address.push(station["address"]["address1"]);
        address.push(station["address"]["city"]);
        address.push(station["address"]["state_name"]);
        /*
		$.map(station["address"], function(value, key) {
			address.push(value);
		});
		*/
  		$("#availableStations").append('<div class="station">' +
									      '<div class="station-img"><img src="available.png"></div>' +
									      '<div class="station-content">' +
									        '<div class="station-name">'+station["station_name"].join(' ')+'</div>' +
									        '<div class="station-address">'+address.join(', ')+'</div>' +
									        '<div class="station-port-info">'+station["port_count"]["available"]+' out of '+station["port_count"]["total"]+' available</div>' +
									      '</div>' +
									    '</div>');
  },

  captureChargingCardDetails : function() {
  		var _this = this;
  		/*
	  	if(_this.loggedInUser==null) {
	  		return;
	  	}
	  	*/
  		$.post("https://nissan.chargepoint.com/dashboard/getUsersCardList", {"isAjax": true}, function(response) {
  			response = JSON.parse(response);
  			if(response && response.content && response.content.length>0 && response.content[0] && response.content[0]['serial_number']) {
	  			_this.cardSerialNumber = response.content[0]['serial_number'];
	  			_this.captureChargingInfo();
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
  			var dataobj = response['content']['graph_data'][0];
  			var power = dataobj['power'];
  			var energy = dataobj['energy'];
  			var duration = dataobj['duration'];
  			var percent = dataobj['soc'];
  			$("#charging-power").text(power+' kW');
  			$("#charging-energy").text(energy+' kWh');
  			$("#charging-duration").text(duration);
  			if(percent!='') {
	  			$("#charging-percent").text('('+percent+'%)');
	  		}

  			$(".charging-details").removeClass('hide');
		});
  },
  
};

PowerUp.init();
