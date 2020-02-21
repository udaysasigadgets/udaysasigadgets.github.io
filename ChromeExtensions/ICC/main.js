var service = analytics.getService('ICC_2105_Live_Updates');
service.getConfig().addCallback(function() {
	console.log('analytics service created');
});
var tracker = service.getTracker('UA-1214589-33');
tracker.sendAppView('MainView');
