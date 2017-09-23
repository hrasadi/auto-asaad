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

if (fs.existsSync(running_dir + "/liquidsoap-handlers/notify-clip-start.js")) {
	var CustomHandler = require(running_dir + "/liquidsoap-handlers/notify-clip-start");
	customApplicationHandler = new CustomHandler(running_dir);
}

var findClip = function(programIdx, clipAbsolutePath) {
	var program = lineup.Programs[programIdx];	
	
	if (program) {
		if (program.PreShow) {
			for (var i = 0; i < program.PreShow.Clips.length; i++) {
				var cAbsolutePath = path.resolve(media_dir, program.PreShow.Clips[i].Path);
				if (clipAbsolutePath == cAbsolutePath) {
					return program.PreShow.Clips[i];
				}
			}
			// it might be the filler clip
			if (program.PreShow.FillerClip) {
				var cAbsolutePath = path.resolve(media_dir, program.PreShow.FillerClip.Path);
				if (clipAbsolutePath == cAbsolutePath) {
					return program.PreShow.FillerClip;
				}			
			}

		}
		for (var i = 0; i < program.Show.Clips.length; i++) {
			var cAbsolutePath = path.resolve(media_dir, program.Show.Clips[i].Path);
			if (clipAbsolutePath == cAbsolutePath) {
				return program.Show.Clips[i];
			}		
		}
	}

	return null;
}

if (fs.existsSync(lineupFilePath)) {
	lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));
	var currentProgramIdx = parseInt(fs.readFileSync(lineupFilePath + ".program.iter", 'utf8'));

	clip = findClip(currentProgramIdx, currentClipFilePath);

	// might be the first clip of the next program
	if (!clip) {
		if (lineup.Programs[currentProgramIdx + 1]) {			
			upcomingClipAbsolutePath = path.resolve(media_dir, lineup.Programs[currentProgramIdx + 1].Show.Clips[0].Path);

			if (currentClipFilePath == upcomingClipAbsolutePath) {
				// In case of back-to-back programs, we need to move program iter when the first 
				// media of the next program begins to play.
				// Lets shift the current program iterator
				currentProgramIdx++;
				clip = findClip(currentProgramIdx, currentClipFilePath);

				// update the current program
				fs.writeFileSync(lineupFilePath + ".program.iter", currentProgramIdx);
			}
		}
	}

	var status = {};
	if (clip) {
		// We have program playing
		status.isCurrentlyPlaying = true;
		status.currentBox = lineup.Programs[currentProgramIdx].BoxId;
		status.currentProgram = lineup.Programs[currentProgramIdx].Title;
		status.currentClip = clip.Description ? clip.Description : "";

		fs.writeFileSync(running_dir + "/web/status.json", JSON.stringify(status));

	} else {
		// No programs right now (this is propapbly the blank clip playing)!  Instead publish the countdown
		status.isCurrentlyPlaying = false;
		status.currentProgram = "BLANK";

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

		fs.writeFileSync(running_dir + "/web/status.json", JSON.stringify(status));
	}

	if (customApplicationHandler) {
		customApplicationHandler.perform('مثنوی')
	}
} 
