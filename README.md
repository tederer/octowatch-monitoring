# Monitoring Service
This repository contains the source code of the monitoring service, which is part of the [Underwater Camera Project](https://underwater-camera-project.github.io).

## Features

The service periodically collects temperature and humidity data and makes it available in the Prometheus text-based display format. An HTTP GET request on port 9090 and the path `/metrics` can be used to retrieve the data. In addition, the same data will be returned in JSON format if the path `/jsonData` is used instead. To measure the temperature and humidity inside the camera, an external sensor (DHT20) is connected to the Raspberry Pi. The following values are reported:

* CPU temperature
* GPU temperature
* environment temperature
* environment humidity

## Installation

The following steps describe how to install the monitoring service on your Raspberry Pi.

1. Connect the external sensor (DHT20) to the pins 1 (3,3 V), 3 (SDA), 5 (SCL), and 9 (GND) of the 40 pin header
2. Execute `sudo apt-get update`.
3. Execute `sudo apt install i2c-tools` to install tools required for I2C communication.
4. Execute `sudo apt install nodejs npm` to install the JavaScript runtime environment.
5.  Clone this repository
6.  Execute `build.sh`

## Starting the service

Execute `start.sh`.

## References

https://prometheus.io/docs/instrumenting/exposition_formats/  
https://prometheus.io/docs/concepts/data_model/  
https://prometheus.io/docs/concepts/metric_types/  
  
