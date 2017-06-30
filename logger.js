var winston = require('winston')

module.exports = function(logFilePath) {
  // set default log level.
  var logLevel = 'debug'

  // Set up logger
  var customColors = {
    trace: 'white',
    debug: 'green',
    info: 'blue',
    warn: 'yellow',
    crit: 'red',
    fatal: 'red'
  }

  var logger = new (winston.Logger)({
    colors: customColors,
    level: logLevel,
    levels: {
      fatal: 0,
      crit: 1,
      warn: 2,
      info: 3,
      debug: 4,
      trace: 5
    },
    transports: [
      new (winston.transports.Console)({
        colorize: true,
        timestamp: true
      }),
      new (winston.transports.File)({ filename: logFilePath })
    ]
  })

  winston.addColors(customColors)

  // Extend logger object to properly log 'Error' types
  var origLog = logger.log

  logger.log = function (level, msg) {
    if (msg instanceof Error) {
      var args = Array.prototype.slice.call(arguments)
      args[1] = msg.stack
      origLog.apply(logger, args)
    } else {
      origLog.apply(logger, arguments)
    }
  }

  return logger;
}

