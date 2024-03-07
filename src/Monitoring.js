/* global octowatch, common, assertNamespace, setTimeout */

require('./common/logging/LoggingSystem.js');

require('./CpuTemperature.js');
require('./GpuTemperature.js');
require('./Dht20.js');

const fs = require('node:fs');

assertNamespace('octowatch');

octowatch.Monitoring = function Monitoring() {
   const TIMEOUT_IN_MS               = 10000;
   const MAX_ALLOWED_ENV_TEMPERATURE = 40;
   const SEMAPHORE_FILE              = '/home/tux/.temperatureTooHigh';
   const LOGGER                      = common.logging.LoggingSystem.createLogger('Monitoring');
   
   var currentValues                 = {};
   var environmentTemperatureTooHigh = false;
   
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
   
   var updateSemaphoreFile = function updateSemaphoreFile() {
      if (environmentTemperatureTooHigh) {
         LOGGER.logInfo('creating semaphore file');
         fs.writeFileSync(SEMAPHORE_FILE, '');
      } else {
         if (fs.existsSync(SEMAPHORE_FILE)) {
            LOGGER.logInfo('removing semaphore file');
            fs.rmSync(SEMAPHORE_FILE);
         }
      }
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
      
      if (key === 'env') {
         var tooHigh = temperature > MAX_ALLOWED_ENV_TEMPERATURE;
         currentValues.temperatures.env.tooHigh = tooHigh;
         if (environmentTemperatureTooHigh !== tooHigh) {
            environmentTemperatureTooHigh = tooHigh;
            updateSemaphoreFile();
         }
      }
   };
   
   this.getValues = function getValues() {
      return currentValues;
   };
   
   updateSemaphoreFile();
   
   new octowatch.CpuTemperature(onTemperatureUpdate.bind(undefined, 'cpu'));
   new octowatch.GpuTemperature(onTemperatureUpdate.bind(undefined, 'gpu'));
   new octowatch.Dht20(onTemperatureUpdate.bind(undefined, 'env'), onHumidityUpdate);
   
   removeTooOldValues();
};