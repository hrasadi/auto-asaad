const Logger = require('../logger');

const logger = new Logger('./log');

const Context = {
    CWD: '.',
    Defaults: {
        Publishing: {
            SocialListeningProps: {
                DefaultLife: 24,
                MaxLife: 48,
                VoteBonus: 0.5,
            },
        },
        Version: '3.0',
    },
    Logger: logger,
    LineupManager: null,
    LineupFileNamePrefix: 'raa1',
};

module.exports = Context;
