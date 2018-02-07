const fs = require('fs');

const cwd = process.argv[2];

let fillerClipLockFilePath = cwd + '/run/interrupting-preshow-filler.liquidsoap.lock';

// path to the current (or most recent) filler clip lock file
if (fs.existsSync(fillerClipLockFilePath)) {
    let fillerItem = fs.readFileSync(fillerClipLockFilePath, 'utf8');
    console.log(fillerItem);
} else {
    // else print nothing, no filler available (no preshow in progress or finished before)
    // However, stall liquidsoap for a bit, as it is very regularly call us!
    setTimeout(null, 5000);
}
