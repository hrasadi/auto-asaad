const fs = require('fs');

// const cwd = process.argv[2];
// path to the lineup file
const lineupFilePath = process.argv[3];
const boxCanonicalIdPath = process.argv[4];

let findbox = (lineup, boxCanonicalIdPath) => {
    for (let box of lineup.Boxes) {
        if (box.CanonicalIdPath == boxCanonicalIdPath) {
            return box;
        }
    }

    throw Error(`Box ${boxCanonicalIdPath} not found!`);
};

if (fs.existsSync(lineupFilePath)) {
    let lineup = JSON.parse(fs.readFileSync(lineupFilePath, 'utf8'));

    // find the box
    let box = findbox(lineup, boxCanonicalIdPath);

    for (let program of box.Programs) {
        for (let clip of program.Show.Clips) {
            console.log(clip.Media.Path);
        }
    }
} else {
    throw Error(`Fatal error! Cannot find lineup ${lineupFilePath}`);
}
