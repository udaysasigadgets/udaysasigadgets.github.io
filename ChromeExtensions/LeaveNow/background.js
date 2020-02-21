
var LeaveNow = {

    //threshold in minutes
    THRESHOLD: 10,

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

            $.each(locations, function(i, obj) {
                var destination = obj.address;
                _this.calculateTime(userLocation, destination, obj);
            });
            
        });
        
        setTimeout(function() {
            _this.checkDriveTimes();
        }, _this.THRESHOLD * 60 * 1000);
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
            var drivetime = response.rows[0].elements[0].duration.value;

            var target = moment(obj.time, "h:mma");
            var now = moment();
            var driveend = now.add(drivetime, 'seconds');

            var expectedarrivaltime = driveend.format('h:mma');
            var leadtime = target.diff(driveend, 'minutes');
            if(leadtime>0 && leadtime<_this.THRESHOLD) {
                _this.notify('Based on current traffic, you should leave now to reach '+obj.location+' ('+obj.address+') on time. Your expected arrival time is '+expectedarrivaltime, 'Leave Now - '+obj.location, 'leavenow');
            }
            //console.log(target.diff(driveend, 'minutes'));
        });
    },
    notify : function(msg, title, id) {
        var opt = {
            type: 'basic',
            iconUrl: 'leavenow.png',
            title: title,
            message: msg
        };
        chrome.notifications.create(id, opt, function(notifId) { 
            if(chrome.runtime.lastError) {
                console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
            }
        });
        
        setTimeout(function(){
            chrome.notifications.clear(id, function() {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
            });
        }, 10000);
        
        //this.tracker.sendEvent("Notification", "Match Event");
    }
};