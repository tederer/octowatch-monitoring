/* global octowatch, common, assertNamespace, setTimeout */

const childprocess = require('node:child_process');

require('./common/logging/LoggingSystem.js');

assertNamespace('octowatch');

octowatch.Dht20 = function Dht20(temperatureConsumer, humidityConsumer) {
   var LOGGER = common.logging.LoggingSystem.createLogger('Dht20');
   var POLLING_INTERVAL_IN_MS = 5000;
   var readTemperature; // declaring it here to avoid linter error
   
   var scheduleNextRead = function scheduleNextRead(startOfReadOperation) {
      var timeoutInMs = 0;
      if (startOfReadOperation !== undefined) {
         var readDuration = Date.now() - startOfReadOperation;
         timeoutInMs = Math.max(0, POLLING_INTERVAL_IN_MS - readDuration);
      }
      setTimeout(readTemperature, timeoutInMs);
   };
   
   readTemperature = async function readTemperature() {
      var startOfReadOperation = Date.now();
      childprocess.exec('./readDht20.sh', (error, stdout, stderr) => {
         if (error) {
            LOGGER.logError('failed to read temperature: ' + error);
            LOGGER.logError('stderr: ' + stderr);
         } else {
            LOGGER.logDebug('command output: ' + stdout);
            var splitResult = stdout.split(';');
            if (splitResult.length !== 2) {
               LOGGER.logError('failed to extract values from: ' + stdout);
            } else {
               var temperature = splitResult[0] * 1;
               var humidity    = splitResult[1] * 1;
               temperatureConsumer(temperature);
               humidityConsumer(humidity);
            }
         }   
         scheduleNextRead(startOfReadOperation);
      });
   };
   
   scheduleNextRead();
};