// this is the code which will be injected into a given page...

(function() {

	var url = 'http://127.0.0.1:8080/js/ks.js', id='kloudspotinject';

	var s='script', d = document;
	var fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	var js = d.createElement(s); js.src = url; js.id = id;
	fjs.parentNode.insertBefore(js, fjs);

})();