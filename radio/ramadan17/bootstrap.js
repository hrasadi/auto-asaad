var fs = require('fs');

// create necassary directories
try {
	fs.mkdirSync('./logs');
} catch(e) {
	console.log(e);
}

try {
	fs.mkdirSync('./lineups');
} catch(e) {
	console.log(e);
}

try {
	fs.chmodSync('./lineups', '777');
} catch(e) {
	console.log(e);
}

