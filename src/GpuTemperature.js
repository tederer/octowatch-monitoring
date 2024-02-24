/* global octowatch, common, assertNamespace, setTimeout */

const childprocess = require('node:child_process');

require('./common/logging/LoggingSystem.js');

assertNamespace('octowatch');

octowatch.GpuTemperature = function GpuTemperature(dataConsumer) {
   var LOGGER = common.logging.LoggingSystem.createLogger('GpuTemperature');
   var POLLING_INTERVAL_IN_MS = 5000;
   var readTemperature; // declaring it here to avoid linter error
   
   var onRawTemperatureRead = function onRawTemperatureRead(rawTemperature) {
      var temperature = rawTemperature.trim() / 1000;
      LOGGER.logDebug('temp = ' + temperature);
      dataConsumer(temperature);
   };
   
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
      childprocess.exec('vcgencmd measure_temp', (error, stdout, stderr) => {
         if (error) {
            LOGGER.logError('failed to read temperature: ' + error);
            LOGGER.logError('stderr: ' + stderr);
         } else {
            LOGGER.logDebug('command output: ' + stdout);
            var regex = /\d+(\.(\d+)?)?/;
            var found = stdout.match(regex);
            if (found === null) {
               LOGGER.logError('failed to apply regex to: ' + stdout);
            } else {
               var temperature = found[0] * 1;
               dataConsumer(temperature);
            }
         }   
         scheduleNextRead(startOfReadOperation);
      });
   };
   
   scheduleNextRead();
};