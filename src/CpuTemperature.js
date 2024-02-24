/* global octowatch, common, assertNamespace, setTimeout */

const fs = require('node:fs/promises');

require('./common/logging/LoggingSystem.js');

assertNamespace('octowatch');

octowatch.CpuTemperature = function CpuTemperature(dataConsumer) {
   var LOGGER = common.logging.LoggingSystem.createLogger('CpuTemperature');
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
      fs.readFile('/sys/class/thermal/thermal_zone0/temp', { encoding: 'utf8' })
         .then(rawTemperature => {
            LOGGER.logDebug('raw value read: ' + rawTemperature);
            onRawTemperatureRead(rawTemperature);
            scheduleNextRead(startOfReadOperation);
         })
         .catch(error => {
            LOGGER.logError('failed to read temperature file: ' + error);
            scheduleNextRead(startOfReadOperation);
         });
   };
   
   scheduleNextRead();
};