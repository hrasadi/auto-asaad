var fs = require('fs');
var path = require('path');
var moment = require('moment');
var execSync = require('child_process').execSync;

// path to the lineup file
var running_dir = process.argv[2];
var lineupFilePath = fs.readFileSync(running_dir + "/lineups/current", 'utf8');
var media_dir = process.argv[3];
var currentClipFilePath = process.argv[4];

var lineup = null;

var findClip = function(programIdx, clipAbsolutePath) {
	var program = lineup.Programs[programIdx];	
	
	if (program.PreShow) {
		for (var i = 0; i < program.PreShow.Clips.length; i++) {
			var cAbsolutePath = path.resolve(media_dir, program.PreShow.Clips[i].Path);
			if (clipAbsolutePath == cAbsolutePath) {
				return program.PreShow.Clips[i];
			}
		}
	}
	for (var i = 0; i < program.Show.Clips.length; i++) {
		var cAbsolutePath = path.resolve(media_dir, program.Show.Clips[i].Path);
		if (clipAbsolutePath == cAbsolutePath) {
			return program.Show.Clips[i];
		}		
	}

	return null;
}

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));
	var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

	clip = findClip(currentProgramIdx, currentClipFilePath);

	// might be 
	if (!clip) {
		upcomingClipAbsolutePath = path.resolve(media_dir, lineup.Programs[currentProgramIdx + 1].Show.Clips[0].Path)
		if (lineup.Programs[currentProgramIdx + 1] && 
			currentClipFilePath == upcomingClipAbsolutePath) {
			// In case of back-to-back programs, we need to move program iter when the first 
			// media of the next program begins to play.
			// Lets shift the current program iterator
			currentProgramIdx++;
			clip = findClip(currentProgramIdx, currentClipFilePath);
			// TODO
			// fs.writeFileSync(lineupFilePath + ".program.iter", currentProgramIdx);
		}
	}

	if (clip) {
		// We have program playing
		status = {};
		status.isCurrentlyPlaying = true;
		status.currentProgram = lineup.Programs[currentProgramIdx].Title;
		status.currentClip = clip.Description ? clip.Description : "";

		fs.writeFileSync(running_dir + "/web/status.json", status);

	} else {
		// No programs right now! Instead publish the countdown
		status = {};
		status.isCurrentlyPlaying = false;
		status.currentProgram = BLANK;
		status.now = moment().format();

		if (lineup.Programs[currentProgramIdx + 1]) {
			
			nextProgram = lineup.Programs[currentProgramIdx + 1];
			status.nextBoxId = nextProgram.BoxId;
			status.nextBoxStartTime = nextProgram.PreShow ? 
										nextProgram.PreShow.Meta.TentativeStartTime : 
										nextProgram.Show.Meta.TentativeStartTime;
		} else {
			// TODO
			// Todays programs is over, we should check the next days lineup 
		}

		fs.writeFileSync(running_dir + "/web/status.json", status);
	}
}
