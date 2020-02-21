var service = analytics.getService('FWC_2104_Live_Updates');
service.getConfig().addCallback(function() {
	console.log('analytics service created');
});
var tracker = service.getTracker('UA-1214589-30');
tracker.sendAppView('MainView');
