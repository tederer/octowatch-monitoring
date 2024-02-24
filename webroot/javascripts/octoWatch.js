
var recursiveAssertObject = function recursiveAssertObject(parentObject, objects) {
   
   if (parentObject[objects[0]] === undefined) {
      parentObject[objects[0]] = {};  
   }
   
   var newParentObject = parentObject[objects[0]];
   
   if (objects.length > 1) {
      recursiveAssertObject(newParentObject, objects.slice(1));
   }
};

assertNamespace = function assertNamespace(namespace) {
   
   var rootObject = (typeof window === 'undefined') ? global : window;
   var objects = namespace.split('.');
   recursiveAssertObject(rootObject, objects);
};

assertNamespace('common.logging');

/**
 * ConsoleLogger writes the log output to the console.
 */
common.logging.ConsoleLogger = function ConsoleLogger(name, minLogLevel) {
   var MESSAGE_SEPARATOR = ';';
   var logLevel = minLogLevel;

   var formatNumber = function formatNumber(expectedLength, number) {
      var result = number.toString();
      while(result.length < expectedLength) {
         result = '0' + result;
      }
      return result;
   };

   var log = function log(level, messageOrSupplier) {
      if (level.value >= logLevel.value) {
         var timestamp = (new Date()).toISOString();
         var message = typeof messageOrSupplier === 'function' ? messageOrSupplier() : messageOrSupplier;
         console.log([timestamp, level.description, name, message].join(MESSAGE_SEPARATOR));
      }
   };

   this.setMinLogLevel = function setMinLogLevel(minLogLevel) {
      logLevel = minLogLevel;
   };

   this.logDebug = function logDebug(messageOrSupplier) {
      log(common.logging.Level.DEBUG, messageOrSupplier);
   };
   
   this.logInfo = function logInfo(messageOrSupplier) {
      log(common.logging.Level.INFO, messageOrSupplier);
   };
   
   this.logWarning = function logWarning(messageOrSupplier) {
      log(common.logging.Level.WARNING, messageOrSupplier);
   };
   
   this.logError = function logError(messageOrSupplier) {
      log(common.logging.Level.ERROR, messageOrSupplier);
   };
};



assertNamespace('common.logging');

/**
 * Logger provides methods to log messages with differen log levels. 
 * Each message accepts a message (String) or a supplier (a function returning a String).
 * Suppliers should get used when the propability is high that the message will not get 
 * logged and building the message costs a lot of time.
 */
common.logging.Logger = function Logger() {
   
   var createErrorFor = function createErrorFor(functionName) {
      return new Error('implementation of common.logging.Logger did not implement the method \"' + functionName + '\"');
   };
   
   this.setMinLogLevel = function setMinLogLevel(level) {
      throw createErrorFor('setMinLogLevel');
   };

   this.logDebug = function logDebug(messageOrSupplier) {
      throw createErrorFor('logDebug');
   };
   
   this.logInfo = function logInfo(messageOrSupplier) {
      throw createErrorFor('logInfo');
   };
   
   this.logWarning = function logWarning(messageOrSupplier) {
      throw createErrorFor('logWarning');
   };
   
   this.logError = function logError(messageOrSupplier) {
      throw createErrorFor('logError');
   };
};

assertNamespace('common.logging');

common.logging.Level = {
   DEBUG:   {value:1, description:'DEBUG'},
   INFO:    {value:2, description:'INFO'},
   WARNING: {value:3, description:'WARNING'},
   ERROR:   {value:4, description:'ERROR'},
   OFF:     {value:5, description:'OFF'}
};

var LoggingSystemImpl = function LoggingSystemImpl() {

   var loggers = [];

   this.logLevel = common.logging.Level.INFO;

   this.setMinLogLevel = function setMinLogLevel(level) {
      this.logLevel = level;
      loggers.forEach(logger => logger.setMinLogLevel(level));
   };

   this.createLogger = function createLogger(name) {
      var logger = new common.logging.ConsoleLogger(name, this.logLevel);
      loggers.push(logger);
      return logger;
   };
};

common.logging.LoggingSystem = new LoggingSystemImpl();

assertNamespace('common');

var fs = common.getVersion = function getVersion() {
    var result;
    try {
        var fileContent = fs.readFileSync('./package.json', 'utf8');
        var packageJson = JSON.parse(fileContent);
        result = packageJson.version;
    } catch(e) {
        result = e;
    }
    return result;
};
common.logging.ConsoleLogger.prototype = new common.logging.Logger();