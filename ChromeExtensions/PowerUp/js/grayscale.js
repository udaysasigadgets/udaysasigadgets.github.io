$( document ).ready(function() {

    var map, geocoder;
    var boundsChangeTimeout = null;
    var markers = [];

    function initMap() {

        geocoder = new google.maps.Geocoder();

        var prefZoom = localStorage['z'];
        var mapZoom, mapCenter;
        var infowindow = new google.maps.InfoWindow();
        if(prefZoom) {
            var perfCenter = JSON.parse(localStorage['c']);
            mapZoom = parseInt(prefZoom, 10);
            mapCenter = perfCenter;
        } else {
            mapZoom = 4;
            mapCenter = {lat: -39.10, lng: -98.43};
        }

        map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            zoom: mapZoom
        });

        map.addListener('bounds_changed', function() {
            if(boundsChangeTimeout) {
                clearTimeout(boundsChangeTimeout);
            }
            boundsChangeTimeout = setTimeout(function() {
                //console.log('Zoom: ' + map.getZoom());
                //console.log('Current Center: '+map.getCenter());

                var bounds = map.getBounds();
                var ne = bounds.getNorthEast();
                var sw = bounds.getSouthWest();

                var b = {
                    'ne' : {
                        'lat' : ne.lat(), 'lng': ne.lng()
                    },
                    'sw' : {
                        'lat' : sw.lat(), 'lng': sw.lng()
                    }
                }
                

                var center = map.getCenter();
                var c = { 'lat' : center.lat(), 'lng': center.lng() };
                localStorage['z'] = map.getZoom();
                localStorage['c'] = JSON.stringify(c);
                localStorage['b'] = JSON.stringify(b);

                //Delete all markers on the Map
                deleteMarkers();

                //Load all the charging stations on the map
                var obj = {};
                obj["station_list"] = {"screen_width": 1272, "screen_height":627, "ne_lat":b.ne.lat, "ne_lon":b.ne.lng, "sw_lat":b.sw.lat, "sw_lon":b.sw.lng, "page_size": 100,"page_offset":"","sort_by":"distance","user_lat":b.sw.lat,"user_lon":b.sw.lng,"include_map_bound":true };
                obj["station_list"]["filter"] = {"connector_l1":false,"connector_l2":true,"is_bmw_dc_program":false,"is_nctc_program":false,"connector_chademo":true,"connector_combo":false,"connector_tesla":false,"price_free":false,"status_available":false,"network_chargepoint":false,"network_blink":false,"network_semacharge":false,"network_evgo":false};
                obj["user_id"] = localStorage['cu']?parseInt(localStorage['cu']):'';

                $.get("https://mc.chargepoint.com/map-prod/get?"+JSON.stringify(obj), function(resp) {
                    //resp = JSON.parse(resp);
                    //console.log('Number of charging stations in the area : '+resp[0]["map_data"]["map_data_size"]);
                    $.each(resp["station_list"]["summaries"], function(i, station) {
                        var myLatLng = {lat: parseFloat(station.lat, 10), lng: parseFloat(station.lon, 10)};
                        var available = station["port_count"]["available"]>0;
                        var address = [];
                        /*
                        $.map(station["address"], function(value, key) {
                            address.push(value);
                        });
                        */
                        address.push(station["address"]["address1"]);
                        address.push(station["address"]["city"]);
                        address.push(station["address"]["state_name"]);
                        var color = available? 'green':'red';
                        var marker = new google.maps.Marker({
                            position: myLatLng,
                            icon: available?'available16.png':'busy16.png',
                            map: map,
                            info: '<span style="color:'+color+';font-size:130%">'+station["station_name"].join(' ')+'</span><br><span style="color:'+color+';">'+address.join(', ')+'</span><br><span style="color:black;">'+station["port_count"]["available"]+' of '+station["port_count"]["total"]+' available'+'</span>'
                        });
                        google.maps.event.addListener(marker, 'click', function () {
                            infowindow.setContent(this.info);
                            infowindow.open(map, this);
                        });

                        markers.push(marker);
                    })
                });
                /*
                var u = 'scWidth=1425&scHeight=912&f_estimationfee=false&f_available=true&f_inuse=true&f_unknown=true&f_cp=true&f_other=true&is_nctc_program=false&f_l3=true&f_l2=true&f_l1=true&f_estimate=false&f_fee=true&f_free=true&f_reservable=false&f_shared=true&f_chademo=true&f_saecombo=true&f_tesla=true&community=true&non_community=true&show_mode2_only=false&show_mode1_only=false';
                u += '&neLat='+b.ne.lat+'&neLng='+b.ne.lng+'&swLat='+b.sw.lat+'&swLng='+b.sw.lng;
                var params = u.split("&");
                var data = {};
                $.each(params, function(i, p) {
                    var keyval = p.split('=');
                    data[keyval[0]] = keyval[1];
                });
                
                $.post("https://nissan.chargepoint.com/dashboard/get_map_data", data, function(resp) {
                    resp = JSON.parse(resp);
                    //console.log('Number of charging stations in the area : '+resp[0]["map_data"]["map_data_size"]);
                    $.each(resp[0]["map_data"]["summaries"], function(i, station) {
                        var myLatLng = {lat: parseFloat(station.lat, 10), lng: parseFloat(station.lon, 10)};
                        var available = station["port_count"]["available"]>0;
                        var marker = new google.maps.Marker({
                            position: myLatLng,
                            icon: available?'available16.png':'busy16.png',
                            map: map
                        });
                        markers.push(marker);
                    })
                });
                */

                /* DONT USE THIS : This gives only online stations
                var url = 'https://na.chargepoint.com/dashboard/getChargeSpots?ne_lat='+b['ne']['lat']+'&ne_lng='+b['ne']['lng']+'&sw_lat='+b['sw']['lat']+'&sw_lng='+b['sw']['lng']
                                    +'&f_chademo=true'
                                    +'&f_free=true'
                                    +'&f_l2=true'
                                    +'&f_l3=true';
                $.get(url, function(resp) {
                    resp = JSON.parse(resp);
                    $.each(resp[0]["station_list"]["summaries"], function(i, station) {
                        var myLatLng = {lat: parseFloat(station.lat, 10), lng: parseFloat(station.lon, 10)};
                        var available = station["port_count"]["available"]>0;
                        var marker = new google.maps.Marker({
                            position: myLatLng,
                            icon: available?'available16.png':'busy16.png',
                            map: map
                        });
                        markers.push(marker);
                    })
                });
                */                 

            }, 500);
        });
        
        function clearMarkers() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
        }
        // Deletes all markers in the array by removing references to them.
        function deleteMarkers() {
            clearMarkers();
            markers = [];
        }

        function codeAddress(address) {
            geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(18);
                } else {
                    console.log("Geocode was not successful for the following reason: " + status);
                }
            });
        }

        $(".searchbox input").on('keyup', function(e) {
            var code = e.which; // recommended to use e.which, it's normalized across browsers
            if(code==13){
                codeAddress($(this).val());
                $(this).blur();
            } 
        });
    }

    initMap();

    if(localStorage['ce']) {
        $('#ce').val(localStorage['ce']);
    }
    if(localStorage['cp']) {
        $('#cp').val('*******');
    }
    if(localStorage['cph']) {
        $('#cph').val(localStorage['cph']);
    }

    $(".powerupinput").blur(function() {
        var id = $(this).attr('id');
        localStorage[id] = $(this).val();
    });

    $(".clearprefs").click(function() {
        var id = $(this).attr('id');
        if(id=='loginclearprefs') {
            localStorage.removeItem('ce'); $("#ce").val('');
            localStorage.removeItem('cp'); $("#cp").val('');
            localStorage.removeItem('cu');

            $.get("https://nissan.chargepoint.com/logout", function(resp) {
                console.log("User logged out");
            });

        } else if(id=='phoneclearprefs') {
            localStorage.removeItem('cph'); $("#cph").val('');
        }
    });

});