/* global octowatch, common, assertNamespace, setTimeout */

require('./common/logging/LoggingSystem.js');

require('./CpuTemperature.js');
require('./GpuTemperature.js');
require('./Dht20.js');

assertNamespace('octowatch');

octowatch.Monitoring = function Monitoring() {
   var TIMEOUT_IN_MS = 10000;
   var LOGGER = common.logging.LoggingSystem.createLogger('Monitoring');
   
   var currentValues = {};
   
   var removeTooOldValues = function removeTooOldValues() {
      var nowInMs =  Date.now();
      
      Object.keys(currentValues.temperatures ?? {}).forEach(key => {
         var temperature = currentValues.temperatures[key] ?? {};
         var age         = nowInMs - (temperature.timestamp ?? 0);
         if (age >= TIMEOUT_IN_MS) {
            LOGGER.logDebug('temperature ' + key + ' timed out -> removing it');
            currentValues.temperatures[key] = undefined;
         }
      });
      
      var humidity = currentValues.humidity ?? {};
      var age      = nowInMs - (humidity.timestamp ?? 0);
      if (age >= TIMEOUT_IN_MS) {
         LOGGER.logDebug('humidity timed out -> removing it');
         currentValues.humidity = undefined;
      }
      
      setTimeout(removeTooOldValues, 1000);
   };
   
   var onHumidityUpdate = function onHumidityUpdate(newHumidity) {
      LOGGER.logDebug('new humidity: ' + newHumidity);
      currentValues.humidity = {value: newHumidity, timestamp: Date.now()};
   };
   
   var onTemperatureUpdate = function onTemperatureUpdate(key, temperature) {
      LOGGER.logDebug('new ' + key + ' temp: ' + temperature);
      if (currentValues.temperatures === undefined) {
         currentValues.temperatures = {};
      }
      currentValues.temperatures[key] = {value: temperature, timestamp: Date.now()};
   };
   
   this.getValues = function getValues() {
      return currentValues;
   };
   
   new octowatch.CpuTemperature(onTemperatureUpdate.bind(undefined, 'cpu'));
   new octowatch.GpuTemperature(onTemperatureUpdate.bind(undefined, 'gpu'));
   new octowatch.Dht20(onTemperatureUpdate.bind(undefined, 'env'), onHumidityUpdate);
   
   removeTooOldValues();
};