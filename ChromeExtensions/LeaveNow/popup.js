var LeaveNow = {

  init: function() {

        var _this = this;

        _this.checkDriveTimes();
    },

    checkDriveTimes: function() {

        var _this = this;

        var locations = [];
        if(localStorage['ln-l']) {
            locations = JSON.parse(localStorage['ln-l']);
        }

        navigator.geolocation.getCurrentPosition(function(position) {
            console.log("Current Location : Latitude : "+position.coords.latitude+":"+" & Longitude : "+ position.coords.longitude);
            var userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if(locations.length===0) {
				$("#destinations").html('No destinations configured. Configure your destinations <a href="options.html" target="options">here</a>')
            }
			$("#destinations").empty();
            $.each(locations, function(i, obj) {
                var destination = obj.address;
                _this.calculateTime(userLocation, destination, obj);
            });
            
        });

    },

    calculateTime: function(origin, destination, obj) {

        var _this = this;

        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            drivingOptions: {
                departureTime: new Date(Date.now()), 
                trafficModel: 'optimistic'
            }
        }, function(response, status) {
            console.log(response);
            console.log('Drive time to '+obj.location+' : '+response.rows[0].elements[0].duration.text);
            var drivetimetext = response.rows[0].elements[0].duration.text;
            var drivetimevalue = response.rows[0].elements[0].duration.value;

            var target = moment(obj.time, "h:mma");
            var now = moment();
            var driveend = now.add(drivetimevalue, 'seconds');

            var expectedarrivaltime = driveend.format('h:mma');

            var html = '<div class="row destination"><div class="col-xs-9 text-left"><span class="size-lg">'+obj.location+'</span><br><span class="size-sm">'+obj.address+'</span></div><div class="col-xs-3 text-left text-center"><span class="size-lg">'+expectedarrivaltime+'</span><br><span class="size-sm">('+drivetimetext+')</span></div></div>';
            $("#destinations").append(html);
        });
    },
  
};
