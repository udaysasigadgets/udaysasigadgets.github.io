// GOOGLE MAP - DEFAULT
google.maps.event.addDomListener(window, 'load', init);

function init() {
	var mapOptions = {
		zoom: 15,
		center: new google.maps.LatLng(37.5285603, -121.9189085)
	};

	var mapElement = document.getElementById('map-default');

	var map = new google.maps.Map(mapElement, mapOptions);

	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(37.5285603, -121.9189085),
		map: map,
		title: 'Snazzy!'
	});
}
