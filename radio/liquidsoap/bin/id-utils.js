let getPartialCanonicalIdPath = (fromIdPath, level) => {
    let components = fromIdPath.split('/');

    if (components.length < IdLevel[level]) {
        throw Error(
            'The provided IdPath is not detailed enough to extract ' +
                level +
                ' level path from it.'
        );
    }

    // form the desired path
    return components.slice(0, IdLevel[level]).join('/');
};

let IdLevel = {
    'Lineup': 1,
    'Box': 2,
    'Program': 3,
};

module.exports = {
    getPartialCanonicalIdPath: getPartialCanonicalIdPath,
    IdLevel: IdLevel,
};
