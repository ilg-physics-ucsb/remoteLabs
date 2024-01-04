#!/bin/bash

# check if python3 and uv4l processes are running
# rev2

# add the line below to /etc/crontab to check every x minutes
# */x * * * * root bash /home/pi/remoteLabs/remotelabs.check.python3.uv4l.running.sh

if pgrep python3 >/dev/null 2>&1 && pgrep uv4l >/dev/null 2>&1

then
        echo "check python3 & uv4l: running"
        # sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME OK" -m " "
else
        echo "check python3 & uv4l: not running"
        # sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m " "
fi