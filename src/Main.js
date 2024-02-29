/* global common, process, octowatch */

require('./common/logging/LoggingSystem.js');
require('./common/Version.js');

require('./Monitoring.js');

const express      = require('express');
          
const DEFAULT_PORT = 9090;
                   
const LOGGER       = common.logging.LoggingSystem.createLogger('Main');
const VERSION      = common.getVersion();
                   
var port           = process.env.WEBSERVER_PORT   ?? DEFAULT_PORT;
var monitoring     = new octowatch.Monitoring();
   
LOGGER.logInfo('version:        ' + VERSION);
LOGGER.logInfo('webserver port: ' + port);

const app = express();

app.use((req, res, next) => {
   LOGGER.logDebug(req.method + ' ' + req.originalUrl);
   //res.append('Access-Control-Allow-Origin', '*');
   next();
});

app.get('/info', (req, res) => {
   res.json({version: VERSION});
});

app.get('/metrics', (req, res) => {
   var currentValues = monitoring.getValues() ?? {};
   
   var temperatureValues = currentValues.temperatures ?? {};
   var content =  '# HELP temperature in degrees celcius\n';
   content     += '# TYPE temperature gauge\n';
   Object.keys(temperatureValues ?? {}).forEach(key => {
      var temperature = temperatureValues[key];
      if (temperature !== undefined) {
         content += 'octowatch_temperature{type="' + key + '"} ' + temperature.value + ' \n';
      }
   });
   
   var humidity = currentValues.humidity;
   if (humidity !== undefined) {
      content += '\n# HELP humidity in percent\n';
      content += '# TYPE humidity gauge\n';
      content += 'octowatch_humidity ' + humidity.value + '\n';
   }
   
   res.set({
     'Content-Type': 'text/plain; charset=utf-8; version=0.0.4',
     'Content-Length': content.length});
   
   res.send(content);
});

app.get('/jsonData', (req, res) => {
   res.json(monitoring.getValues() ?? {});
});

app.listen(port, () => {
   LOGGER.logInfo(`Listening on port ${port}.`);
});
