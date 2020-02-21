$( document ).ready(function() {

    var myEvents = localStorage['myEvents'];
    if(myEvents==null) {
        myEvents = ["FOUR", "SIX", "OUT", "1 run"];
    } else {
        myEvents = myEvents.split(',');
    }

    var myTeams = localStorage['myTeams'];
    if(myTeams==null) {
        myTeams = ["England", "South Africa", "India", "Australia", "Sri Lanka", "Pakistan", "West Indies", "Bangladesh", "New Zealand", "Zimbabwe", "Ireland", "Afghanistan", "Scotland", "United Arab Emirates",
        "Mumbai Indians", "Rajasthan Royals", "Chennai Super Kings", "Kolkata Knight Riders", "Kings XI Punjab", "Sunrisers Hyderabad", "Royal Challengers Bangalore", "Delhi Daredevils"];
    } else {
        myTeams = myTeams.split(',');
    }

    $("#selectedevents option").each(function() {
        var that = this;
        var keys = $(that).val().split(',');
        $.each(myEvents, function(i,v) {
            if(keys.indexOf(v)!=-1) {
                $(that).prop('selected', true);
            }
        });
    });

    $("#selectedteams").val(myTeams);


    function updatePreferences() {
        var myEvents = [];
        $.each($("#selectedevents").val() || [], function(i,v) {
            myEvents = myEvents.concat(v.split(','));
        });

        var myTeams = [];
        myTeams = myTeams.concat($("#selectedteams").val());
        
        localStorage['myEvents'] = myEvents;
        localStorage['myTeams'] = myTeams;
        console.log('Events selected : '+myEvents);
        console.log('Teams selected : '+myTeams);
    }

    $('.selectpicker').on('change', function() {
        updatePreferences();
    }).selectpicker({
        style: 'btn-primary',
        size: 8
    });
});