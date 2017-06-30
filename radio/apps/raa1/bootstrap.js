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

var installStandaloneRadio = function(dates) {
	// nothing!
}

var installLiquidsoapRadio = function(dates) {
	// Copy the .liq file to /etc (The script should be executed with sudo)
	fsExtra.copySync('../liquidsoap/radio.liq', '/etc/liquidsoap/radio.liq'); 
	child_process.execSync('systemctl daemon-reload');

	execSync("echo radio_LS_SCRIPT_DIR=" + LS_SCRIPT_DIR + " >> /etc/default/liquidsoap");
	execSync("echo radio_RUNNING_DIR=" + RUNNING_DIR  + " >> /etc/default/liquidsoap");
	execSync("echo radio_MEDIA_DIR=" + MEDIA_DIR  + " >> /etc/default/liquidsoap");
	execSync("echo radio_FILLER_MEDIA=" + FILLER_MEDIA  + " >> /etc/default/liquidsoap");
	execSync("service liquidsoap restart"); 

	// create necassary directories
	try {

		fs.mkdirSync('./logs');
		fs.chmodSync('./logs', '777');
		
		fs.mkdirSync('./lineups');
		// Let the lineups be writable by other processes (esp. when running liquidsoap as deamon)
		fs.chmodSync('./lineups', '777');
		
		fs.mkdirSync('./pm2-home');
		fs.chownSync('./pm2-home', userid.uid('liquidsoap'), userid.gid('liquidsoap'));
	}

	// register pm2 deamon
	execSync("pm2 startup ubuntu -u liquidsoap --hp " + RUNNING_DIR + "/pm2-home");
	execSync("pm2 start raa1.js -- raa1.conf liquidsoap");
	execSync("pm save");
}

switch (DEPLOYMENT_MODE) {
	case 'standalone':
		installStandaloneRadio();
		break;
	case 'liquidsoap':
		installLiquidsoapRadio();
		break;	
}