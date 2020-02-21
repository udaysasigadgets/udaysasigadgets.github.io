var service = analytics.getService('Cricket_Live_Updates');
service.getConfig().addCallback(function() {
	console.log('analytics service created');
});
var tracker = service.getTracker('UA-1214589-34');
tracker.sendAppView('MainView');
