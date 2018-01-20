const {createLogger, format, transports} = require('winston');

let Logger = function(logFilePath, forceDebug = false) {
  let logger = createLogger({
    level: 'info',
    format: format.combine(
      format.json(),
      format.timestamp(),
      format.align(),
      format.printf((info) => {
        // info
        const {
          timestamp, level, message, args,
        } = info;
        const ts = timestamp.slice(0, 19).replace('T', ' ');
        return `${ts} [${level}]:
          ${message} ${(args && Object.keys(args).length) ?
          JSON.stringify(args, null, 2) : ''}`;
      })
    ),
    transports: [
        new transports.File({filename: logFilePath, level: 'debug'}),
    ],
  });

  if (process.env.NODE_ENV !== 'production' || forceDebug) {
    logger.add(new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.printf((info) => {
          // info
          const {
            timestamp, level, message, args,
          } = info;
          const ts = timestamp.slice(0, 19).replace('T', ' ');
          return `${ts} [${level}]: 
            ${message} ${(args && Object.keys(args).length) ?
            JSON.stringify(args, null, 2) : ''}`;
        })
      ),
    }));
  }

  return logger;
};

module.exports = Logger;
