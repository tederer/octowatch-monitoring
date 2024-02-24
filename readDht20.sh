#!/bin/bash

# Triggers a measurement of the DHT20 and prints the result to STDOUT.
# Debug output gets written to STDOUT when calling the script with "-v" as first argument.
# Output format: <temperature_in_degrees>;<humidity_in_percent>
# Both values are doubles with one decimal place using the "." as decimal-point character.

logEnabled=0

if [ "$1" == "-v" ]; then
   logEnabled=1
fi

function log
{
   if [ $logEnabled -ne 0 ]; then
      echo "$1"
   fi
}

function transfer
{
   i2ctransfer -y 1 $@
   exitCode=$?
   if [ $exitCode -ne 0 ]; then
      echo "ERROR: failed to transfer \"$@\""
      exit 1
   fi
}

function resetReg
{
   log "resetting register $1 ..."
   transfer w4@0x38 0x70 $1 0x00 0x00
   sleep 0.1
   local result=$(transfer w1@0x38 0x71 r3)
   if [ $? -ne 0 ]; then
      echo "ERROR: failed to reset register"
      exit 1
   fi
   local byte2=$(echo "$result" | cut --delimiter=' ' --fields=2)
   local byte3=$(echo "$result" | cut --delimiter=' ' --fields=3)
   local calculatedByte1=$(printf "0x%02x" $((0xb0 | $1)))
   sleep 0.1
   transfer w4@0x38 0x70 $calculatedByte1 $byte2 $byte3
}

which i2ctransfer > /dev/null
exitCode=$?
if [ $exitCode -ne 0 ]; then
   echo "ERROR: i2ctransfer utility not installed. Did you forget to instal i2c-tools?"
   exit 1
fi

log "querying status ..."
result=$(transfer w1@0x38 0x71 r1)
if [ $? -ne 0 ]; then
   echo "ERROR: failed to query status"
   exit 1
fi

if [ "$result" != "0x18" ]; then
   resetReg 0x1b
   resetReg 0x1c
   resetReg 0x1e
fi

log "triggering measurement ..."
transfer w4@0x38 0x70 0xAC 0x33 0x00
sleep 0.1

dataReady=0
while [ $dataReady -ne 0 ]; do
   log "reading status ..."
   result=transfer w1@0x38 0x71 r1
   dataReady=$(($result | 0x80))
   if [ $dataReady -ne 0 ]; then
      sleep 0.1
   fi
done

log "reading measurement ..."
data=$(transfer w1@0x38 0x71 r6)
byte1=$(echo "$data" | cut --delimiter=' ' --fields=1)
byte2=$(echo "$data" | cut --delimiter=' ' --fields=2)
byte3=$(echo "$data" | cut --delimiter=' ' --fields=3)
byte4=$(echo "$data" | cut --delimiter=' ' --fields=4)
byte5=$(echo "$data" | cut --delimiter=' ' --fields=5)
byte6=$(echo "$data" | cut --delimiter=' ' --fields=6)

log "data = $data"

humidity=$(( ($byte2 << 12) | ($byte3 << 4) | (($byte4 & 0xf0) >> 4) ))
temperature=$(( (($byte4 & 0x0f) << 16) | ($byte5 << 8) | $byte6 ))

echo | awk '{temp='$temperature' / 1048576 * 200 - 50; printf "%.1f;", temp}' 
echo | awk '{hum='$humidity' / 1048576 * 100; printf "%.1f", hum}'
