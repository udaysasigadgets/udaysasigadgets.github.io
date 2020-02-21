$( document ).ready(function() {

    var myEvents = localStorage['myEvents'];
    if(myEvents==null) {
        myEvents = ["FOUR", "SIX", "OUT"];
    } else {
        myEvents = myEvents.split(',');
    }

    var myTeams = localStorage['myTeams'];
    if(myTeams==null) {
        myTeams = ["England", "South Africa", "India", "Australia", "Sri Lanka", "Pakistan", "West Indies", "Bangladesh", "New Zealand", "Zimbabwe", "Ireland", "Afghanistan", "Scotland", "United Arab Emirates"];
    } else {
        myTeams = myTeams.split(',');
    }

    $(".eventsTable input[type=checkbox]").each(function() {
        var that = this;
        var keys = $(that).attr("data-key").split(',');
        $.each(myEvents, function(i,v) {
            if(keys.indexOf(v)!=-1) {
                $(that).prop('checked', true);
            }
        });
    });

    $(".teamsTable input[type=checkbox]").each(function() {
        var that = this;
        var key = $(that).attr("data-key");
        if(myTeams.indexOf(key)!=-1) {
            $(that).prop('checked', true);
        }
    });

    $("input[type=checkbox]").bootstrapSwitch().on('switchChange.bootstrapSwitch', function(event, state) {
      updatePreferences();
    });

    function updatePreferences() {
        var myEvents = [];
        $(".eventsTable input[type=checkbox]:checked").each(function() {
            var keys = $(this).attr("data-key").split(',');
            myEvents = myEvents.concat(keys);
        });

        var myTeams = [];
        $(".teamsTable input[type=checkbox]:checked").each(function() {
            var key = $(this).attr("data-key");
            myTeams.push(key);
        });

        localStorage['myEvents'] = myEvents;
        localStorage['myTeams'] = myTeams;
        console.log('Events selected : '+myEvents);
        console.log('Teams selected : '+myTeams);
    }

});