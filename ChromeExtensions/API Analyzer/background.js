
var DNACAPIAnalyzer = {

    //threshold in seconds
    THRESHOLD: 5,
    
    RequestMap: {},
    
    indexedDB: null,

    init: function() {

        var _this = this;
        
        _this.RequestMap = {};
     
        chrome.webRequest.onSendHeaders.addListener(
                function(details) {
                    //console.log(details.requestId +" "+details.method +" "+details.url +" ");
                    //console.log(details);
                    _this.RequestMap[details.requestId] = details;
                }, {
                    urls: ["*://*/api/*"]
                }, ["requestHeaders"]);
        
        chrome.webRequest.onResponseStarted.addListener(
                function(respDetails) {
                    //console.log(respDetails.statusCode +" on "+respDetails.requestId);
                    //console.log(details.requestId +" "+details.method +" "+details.url +" ");
                    //console.log("Received response for "+respDetails.requestId);
                    var reqDetails = _this.RequestMap[respDetails.requestId];
                    var timeTaken = respDetails.timeStamp-reqDetails.timeStamp;
                    //console.log('Time taken for ['+reqDetails.method+'] '+reqDetails.url+' : '+timeTaken+" millisec");
                    //console.log(respDetails);
                    
                    //Remove it from the collection 
                    delete _this.RequestMap[respDetails.requestId];
                    
                    var requestEntry = {
                      'method': respDetails.method,
                      'initiator': respDetails.initiator,
                      'ip': respDetails.ip,
                      'statusCode': respDetails.statusCode,
                      'statusLine': respDetails.statusLine,
                      'url': respDetails.url,
                      'timeTaken': timeTaken,
                      'timeStamp': (new Date()).getTime()
                    };
                    Database.addEntry(requestEntry);
                    
                    //console.log('Number of outstanding requests : '+Object.keys(_this.RequestMap).length);
                    
                }, {
                    urls: ["*://*/api/*"]
                });
        
        chrome.webRequest.onErrorOccurred.addListener(
                function(respDetails) {
                    //console.log(details);
                    //console.log(respDetails.statusCode +" on "+respDetails.requestId);
                    var reqDetails = _this.RequestMap[respDetails.requestId];
                    var timeTaken = respDetails.timeStamp-reqDetails.timeStamp;
                    //console.log('Time taken for ['+reqDetails.method+'] '+reqDetails.url+' : '+timeTaken+" millisec");
                    
                    //Remove it from the collection 
                    delete _this.RequestMap[respDetails.requestId];
                    
                    var requestEntry = {
                        'method': respDetails.method,
                        'initiator': respDetails.initiator,
                        'ip': respDetails.ip,
                        'statusCode': respDetails.statusCode,
                        'statusLine': respDetails.statusLine,
                        'url': respDetails.url,
                        'timeTaken': timeTaken,
                        'timeStamp': (new Date()).getTime()
                    };
                    Database.addEntry(requestEntry);
                          
                    //console.log('Number of outstanding requests : '+Object.keys(_this.RequestMap).length);
                }, {
                    urls: ["*://*/api/*"]
                });
        
        
        /*
        setInterval(function() {
            Database.getWorstPerformingAPI();
        }, _this.THRESHOLD * 1000);
        */
        Database.getWorstPerformingAPI().then(function(rows) {
            var apiListCount = rows.length;
            //console.log('Number of records : '+apiListCount);
            for (i = 0; i < apiListCount; i++){
                var worstapi = rows.item(i);
                console.log(worstapi.url.replace(worstapi.initiator, '') +' - Time taken : '+worstapi.timetaken);
            }
            console.log('Worst performing API: '+worstapi.url.replace(worstapi.initiator, '')+' (Time taken : '+worstapi.timetaken+')');
            _this.notify('Worst performing API: '+worstapi.url.replace(worstapi.initiator, '')+' \n(Time taken : '+worstapi.timetaken+')', 'Database Status', 'dnacAnalyzer');
        }, function(error) {
            console.log('Failed querying database with error : '+error);
        });
    },
    
    notify : function(msg, title, id) {
        var opt = {
            type: 'basic',
            iconUrl: 'dnac-api-analyzer.png',
            title: title,
            message: msg,
            isClickable: true
        };
        chrome.notifications.create(id, opt, function(notifId) { 
            if(chrome.runtime.lastError) {
                //console.log('NotifID '+notifId+' created - Last error:', chrome.runtime.lastError);
            }
        });
        
        setTimeout(function(){
            chrome.notifications.clear(id, function() {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
            });
        }, 2000);
        
        //this.tracker.sendEvent("Notification", "Match Event");
    }
};

DNACAPIAnalyzer.init();