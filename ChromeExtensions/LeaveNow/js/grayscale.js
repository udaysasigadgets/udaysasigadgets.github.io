
    var app = angular.module("LeaveNow", []); 
    app.controller("LeaveNowCtrl", function($scope, $timeout) {

        $scope.editing = false;

        if(localStorage['ln-l']) {
            $scope.locations = JSON.parse(localStorage['ln-l']);
        } else {
            $scope.locations = [];
        }
//$scope.locations = [];
        $scope.saveLocation = function () {
            if(!$scope.editing) {
                $scope.locations.push($scope.entity);
            }

            localStorage['ln-l'] = JSON.stringify($scope.locations);

            $("#newModal").modal('hide');
            $scope.editing = false;
        };

        $scope.addLocation = function() {
            $scope.entity = {
                'location': '',
                'address': '',
                'time': ''
            };
            $("#newModal").modal('show');
        };
        
        $scope.deleteLocation = function(index){
            $scope.locations.splice(index,1);
            localStorage['ln-l'] = JSON.stringify($scope.locations);
        }
        $scope.editLocation = function(index) {
            $scope.editing = true;
            $scope.index = index;
            $scope.entity = $scope.locations[index];
            
            $("#newModal").modal('show');
        }

        function initAutocomplete() {
            // Create the search box and link it to the UI element.
            var input = document.getElementById('address');
            var searchBox = new google.maps.places.SearchBox(input);

            searchBox.addListener('places_changed', function() {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                    return;
                }
                console.log(places);
                $scope.entity.address = places[0]["formatted_address"];
                console.log($scope.entity);
            });
        }

        $timeout(function() {
            initAutocomplete();
        }, 1000);
    });

    


$( document ).ready(function() {

    $('[data-toggle="tooltip"]').tooltip()

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

        } else if(id=='phoneclearprefs') {
            localStorage.removeItem('cph'); $("#cph").val('');
        }
    });

    
});