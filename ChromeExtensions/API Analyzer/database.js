
var Database = {

    init: function() {
        var _this = this;
        _this.db = openDatabase('DNACANALYZER', '1.0', 'Analyzes DNA Center Performance', 10 * 1024 * 1024);
        _this.db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS APIDETAIL (url, method, initiator, ip, statuscode, statusline, timetaken, timestamp)');
         });
    },
    
    addEntry: function(obj) {
        var _this = this;
        _this.db.transaction(function (tx) {  
            tx.executeSql('INSERT INTO APIDETAIL (url, method, initiator, ip, statuscode, statusline, timetaken, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [obj.url, obj.method, obj.initiator, obj.ip, obj.statusCode, obj.statusLine, obj.timeTaken, obj.timeStamp]);
         });
    },
    
    displayApiDetailCounts: function() {
        var _this = this;
        _this.db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM APIDETAIL', [], function (tx, results) {
               var apiListCount = results.rows.length;
               //console.log('Number of records : '+apiListCount);
               console.log('Object Store Count: '+apiListCount+' \n('+(new Date()).toString()+')');
            }, null);
        });
    },
    
    queryDatabase: function(query) {
        var _this = this;
        
        return new Promise(function(resolve, reject) {
            _this.db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, results) {
                   //Resolve with query results
                   resolve(results.rows);
                }, function (tx, err) {
                    reject(err.message);
                });
            });
        });
    },
    
    getWorstPerformingAPI: function() {
        var _this = this;
        return _this.queryDatabase('SELECT * FROM APIDETAIL ORDER BY timetaken desc LIMIT 1');
    },
    
    getAPIsByStatusCodes: function() {
        var _this = this;
        return _this.queryDatabase('SELECT statuscode, count(*) FROM APIDETAIL group by statuscode');
    }
    
};

Database.init();