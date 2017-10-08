var sqlite3 = require('sqlite3').verbose();
var apn = require('apn');

var Raa1ClipStartHandler = function(cwd) {
    this.cwd = cwd;

    /* iOS APN Configuration */
    this.prepareAPNS();

    /* FCM Configuration */
    this.prepareFCM();
}

Raa1ClipStartHandler.prototype.prepareAPNS = function() {
    self = this;

    // Configure DB
    this.iosDB = new sqlite3.Database(this.cwd + '/run/ios-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
        if (err) {
        console.error('Error connecting to database: ' + err.message);        
        }
    });

    this.iosDB.serialize(function() {
        self.iosDB.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
    });

    // Configure APN endpoint
    var apnProviderOptions = {
        production: true
    }

    apnProviderOptions['cert'] = this.cwd + '/conf/cert.pem'
    apnProviderOptions['key'] = this.cwd + '/conf/key.pem'

    this.apnProvider = new apn.Provider(apnProviderOptions);    
}

Raa1ClipStartHandler.prototype.prepareFCM = function() {
    self = this;

    // Configure DB
    this.fcmDB = new sqlite3.Database(this.cwd + '/run/fcm-device-list.db', sqlite3.OPEN_READWRITE, function(err) {
        if (err) {
        console.error('Error connecting to database: ' + err.message);        
        }
    });

    this.fcmDB.serialize(function() {
        self.fcmDB.run("CREATE TABLE if not exists devices (deviceId TEXT PRIMARY_KEY, unique(deviceId))");
    });

    this.firebase = require("firebase-admin");
    var serviceAccount = require(this.cwd + '/conf/raa-firebase.json');

    this.firebase.initializeApp({
      credential: this.firebase.credential.cert(serviceAccount),
      databaseURL: "https://raa-android.firebaseio.com"
    });
}    

Raa1ClipStartHandler.prototype.perform = function(newProgramName, newClipName) {
    self = this

    alert = null;
    if (newProgramName != 'BLANK') {
        alert = 'در حال پخش: ' + newProgramName;
    }

    this.notifyiOSDevices(alert, newProgramName, newClipName);
    this.notifyFCMDevices(alert, newProgramName, newClipName);
}

Raa1ClipStartHandler.prototype.notifyiOSDevices = function(alert, newProgramName, newClipName) {
    self = this;

    // Notify iOS devices
    this.iosDB.all("SELECT deviceId FROM devices", function(err, rows) {
        var notification = new apn.Notification({
            mutableContent: 1,
            expiry: Math.floor(Date.now() / 1000) + 3600,
            category: "media.raa.general",
            topic: "raa.raa-ios-player",
            contentAvailable: 1,
            payload: {
                "sender": "raa1"
            },
        });

        if (alert != null) {
            notification.alert = alert;
            notification.badge = 1;
            notification.payload.currentProgram = newProgramName;
            notification.payload.currentClip = newClipName;
            notification.sound = "ProgramStart.caf";
        } else {
            // otherwise deliver empty alert which indicates playback end and clears all previous alerts
            notification.badge = 0;
        }

        ids = rows.map(function(row) { return row.deviceId })
        self.apnProvider.send(notification, ids).then( (response) => {
            // Cool. Let's cleanup now
            self.iosDB.close();
            self.apnProvider.shutdown();
            
            // Handle node-apn shutdown bug
            // https://github.com/node-apn/node-apn/issues/543
            self.apnProvider.client.endpointManager._endpoints.forEach(endpoint => endpoint.destroy()); // will do
        });        
    });    
}

Raa1ClipStartHandler.prototype.notifyFCMDevices = function(alert, newProgramName, newClipName) {
    self = this;

    var payload = {
        data: {
            sender: "raa1"
        }
    };

    if (alert != null) {
        payload.data.alert = alert;
        payload.data.newProgramName = newProgramName;
        payload.data.newClipName = newClipName;
    }

    this.fcmDB.all("SELECT deviceId FROM devices", function(err, rows) {
        ids = rows.map(function(row) { return row.deviceId })

        self.firebase.messaging().sendToDevice(ids, payload)
            .then(function(response) {
                // See the MessagingDevicesResponse reference documentation for
                // the contents of response.
                console.log("Successfully sent message:", response);    
                
                self.fcmDB.close();
                self.firebase.app().delete();
            })
            .catch(function(error) {
                console.log("Error sending message:", error);
            });
    });
}

module.exports = Raa1ClipStartHandler;