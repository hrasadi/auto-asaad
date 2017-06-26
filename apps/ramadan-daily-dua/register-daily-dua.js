var moment = require('moment');
var fs = require('fs');

var Messaging = require('../../messaging');

var config = null;
if (process.argv.length < 3) {
    console.log("FATAL ERROR: Config file not specified");
    process.exit(1);
}

console.log(fs.readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));

var messaging = new Messaging(config.Messaging);


if (config == null) {
    console.log("FATAL ERROR: Error reading config file");
    process.exit(1);
}

for (i = 0; i < 30; i++) {
    var autoAsaadMessage = "دعای روز " + config.DailyDuas[i].Day + " ماه مبارک رمضان\\n";

    autoAsaadMessage += config.DailyDuas[i].Text + "\\n---\\n" + config.DailyDuas[i].Translation;

    var calEventDateTime = moment(config.RamadanStartDate).add(i, 'days').set('hour', 10).set('minute', 0).format('YYYY-MM-DDTHH:mm:ss');
    messaging.createCalEvent(calEventDateTime, "#scheduler", autoAsaadMessage);
}


