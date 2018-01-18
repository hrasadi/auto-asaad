const AppContext = require('../../../AppContext');

const U = require('../../../collaborativelistening/UserManager');
const UserManager = U.UserManager;
const DeviceTypeEnum = U.DeviceTypeEnum;

const apn = require('apn');

class Raa1UserManager extends UserManager {
    constructor(dbFileName, credentials) {
        super(dbFileName);
    }

    init(credentials) {
        this._credentials = credentials;

        this.initAPNS();
        this.initFCM();

        this.init1();
    }

    shutdown() {
        // Cool. Let's cleanup now
        this._apnProvider.shutdown();
        // Handle node-apn shutdown bug
        // https://github.com/node-apn/node-apn/issues/543
        this._apnProvider.client.endpointManager.
                _endpoints.forEach((endpoint) => endpoint.destroy()); // will do
        this._firebase.app().delete();

        this.shutdown0();
    }

    initAPNS() {
        // Configure APN endpoint
        let apnProviderOptions = {
            production: true,
        };

        apnProviderOptions.cert = AppContext.getInstance().CWD + '/' +
                                                this._credentials.APNS.cert;
        apnProviderOptions.key = AppContext.getInstance().CWD + '/' +
                                                this._credentials.APNS.key;

        this._apnProvider = new apn.Provider(apnProviderOptions);
    }

    initFCM() {
        this._firebase = require('firebase-admin');
        let serviceAccount = require(AppContext.getInstance().CWD + '/' +
                                                this._credentials.Firebase);

        this._firebase.initializeApp({
          credential: this._firebase.credential.cert(serviceAccount),
          databaseURL: 'https://raa-android.firebaseio.com',
        });
    }

    notifyUser(userId, message) {

    }

    async notifyAllUsers(alert, program) {
        // Notify iOS
        let iosUsers = await this.entryListForAll({
            statement: 'DeviceType = ?',
            params: DeviceTypeEnum.iOS,
        });
        this.notifyAPNS(iosUsers.map((entry) => entry.Id), alert, program);

        // Notify FCM
        let fcmUsers = await this.entryListForAll({
            statement: 'DeviceType = ?',
            params: DeviceTypeEnum.Android,
        });
        this.notifyFCM(fcmUsers.map((entry) => entry.Id), alert, program);
    }

    notifyAPNS(recipientIds, alert, program) {
        let notification = new apn.Notification({
            mutableContent: 1,
            expiry: Math.floor(Date.now() / 1000) + 3600,
            category: 'media.raa.general',
            topic: 'raa.raa-ios-player',
            contentAvailable: 1,
            payload: {
                'sender': 'raa1',
            },
        });

        if (alert != null) {
            notification.alert = alert;
            notification.badge = 1;
            notification.payload.program = program;
            notification.sound = 'ProgramStart.caf';
        } else {
            // otherwise deliver empty alert which indicates
            // playback end and clears all previous alerts
            notification.badge = 0;
        }

        this._apnProvider.send(notification, recipientIds).then((response) => {});
    }

    notifyFCM(recipientIds, alert, program) {
        let payload = {
            data: {
                sender: 'raa1',
            },
        };

        if (alert != null) {
            payload.data.alert = alert;
            payload.data.program = program;
        }

        this._firebase.messaging().sendToDevice(recipientIds, payload)
                                    .then((response) => {});
    }
}

module.exports = Raa1UserManager;
