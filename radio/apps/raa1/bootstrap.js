// THIS PROGRAM SHOULD BE EXECUTED WITH ROOT PRIVILEDGES

var fs = require('fs');
var fsExtra = require('fs-extra');
var moment = require('moment');
var path = require('path');
var execSync = require('child_process').execSync;
var userid = require('userid');

var DEPLOYMENT_MODE = 'liquidsoap';
var LS_SCRIPT_DIR = path.resolve('../../liquidsoap');
var RUNNING_DIR = path.resolve('./');
var MEDIA_DIR = '/home/ubuntu/media';

var ICECAST_PASSWORD = process.argv[2];

var installStandaloneRadio = function(dates) {
	// nothing!
}

var installLiquidsoapRadio = function(dates) {
	// Copy the .liq file to /etc (The script should be executed with sudo)
	fsExtra.copySync('../../liquidsoap/radio.liq', '/etc/liquidsoap/radio.liq'); 
	// TODO set the password for icecast in the copied version
	execSync('systemctl daemon-reload');

	execSync("echo radio_LS_SCRIPT_DIR=" + LS_SCRIPT_DIR + " >> /etc/default/liquidsoap");
	execSync("echo radio_RUNNING_DIR=" + RUNNING_DIR  + " >> /etc/default/liquidsoap");
	execSync("echo radio_MEDIA_DIR=" + MEDIA_DIR  + " >> /etc/default/liquidsoap");
        execSync("echo radio_ICECAST_PASSWORD=" + ICECAST_PASSWORD + " >> /etc/default/liquidsoap");
	execSync("service liquidsoap restart"); 

	// create necassary directories
	try {
	    fs.mkdirSync('./logs');
	} catch (e) {
            console.log(e);
        }
        try {
            fs.chmodSync('./logs', '777');
	} catch (e) {
            console.log(e);
        }
	try {	
            fs.mkdirSync('./lineups');
	} catch (e) {
            console.log(e);
        }
	
	try { // Let the lineups be writable by other processes (esp. when running liquidsoap as deamon)
    	    fs.chmodSync('./lineups', '777');
	} catch (e) {
            console.log(e);
        }
	try { 	
            fs.mkdirSync('./pm2-home');
	} catch (e) {
            console.log(e);
        }
	try {
    	    fs.chownSync('./pm2-home', userid.uid('liquidsoap'), userid.gid('liquidsoap'));
	} catch (e) {
                console.log(e);
        }

	// register pm2 deamon
	execSync("alias lpm2='sudo -u liquidsoap PM2_HOME=" + RUNNING_DIR + "/pm2-home/.pm2 pm2'");
	execSync("lpm2 start raa1.js -- raa1.conf liquidsoap");
	execSync("sudo pm2 startup ubuntu -u liquidsoap --hp " + RUNNING_DIR + "/pm2-home");
	execSync("lpm2 save");

	// link the output lineup file to raa web page
	execSync("sudo ln -s " + RUNNING_DIR + "/lineups/lineup.html /var/www/html/lineup.html");
}

switch (DEPLOYMENT_MODE) {
	case 'standalone':
		installStandaloneRadio();
		break;
	case 'liquidsoap':
		installLiquidsoapRadio();
		break;	
}
