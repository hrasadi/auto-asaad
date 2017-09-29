var sqlite3 = require('sqlite3').verbose();
var apn = require('apn');

var Raa1ClipStartHandler = function(cwd) {
    this.cwd = cwd;

    self = this;

    // Configure DB
    this.db = new sqlite3.Database(this.cwd + '/run/ios-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
        if (err) {
        console.error('Error connecting to database: ' + err.message);        
        }
    });

    this.db.serialize(function() {
        self.db.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
    });

    // Configure APN endpoint
    var apnProviderOptions = {
        production: false
    }

    apnProviderOptions['cert'] = this.cwd + '/conf/cert.pem'
    apnProviderOptions['key'] = this.cwd + '/conf/key.pem'

    this.apnProvider = new apn.Provider(apnProviderOptions);    
}

Raa1ClipStartHandler.prototype.perform = function(newProgramName, newClipName) {
    self = this

    this.db.all("SELECT deviceId FROM devices", function(err, rows) {
        var notification = new apn.Notification({
            mutableContent: 1,
            expiry: Math.floor(Date.now() / 1000) + 3600,
            category: "media.raa.general",
            contentAvailable: 1,
            payload: {
                "sender": "raa1"
            },
        });

        if (newProgramName != 'BLANK') {
            notification.alert = 'در حال پخش: ' + newProgramName;
            notification.payload.currentProgram = newProgramName;
            notification.payload.currentClip = newClipName;
            notification.sound = "ProgramStart.caf";
        } // otherwise deliver empty alert which indicates playback end

        ids = rows.map(function(row) { return row.deviceId })
        self.apnProvider.send(notification, ids).then( (response) => {
            // Cool. Let's cleanup now
            self.db.close();
            self.apnProvider.shutdown();
            
            process.exit(0);
        });        
    });
}

module.exports = Raa1ClipStartHandler;