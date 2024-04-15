#!/bin/bash

# check.python3.uv4l.running.sh
# check if python3 and uv4l processes are running
# rev4

# add the line below to /etc/crontab to check every x minutes
# */x * * * * root bash /home/pi/remoteLabs/check.python3.uv4l.running.sh

if pgrep python3 >/dev/null 2>&1 && pgrep uv4l >/dev/null 2>&1
then
	echo "check python3 & uv4l: running"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME OK" -m " "
else
	echo "check python3 & uv4l: not running"

	# append debug info to check.python3.uv4l.running.log
	echo -e "=== \n\n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	echo -e "$(date): python or uv4l are not running! \n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	
	echo -e "/proc/meminfo and uptime commands \n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	echo -e "$(cat /proc/meminfo) \n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	echo -e "$(uptime) \n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
    
	echo -e "processes: \n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	echo -e "$(ps aux |head -1) \n$(ps aux |grep -E 'python3|uv4l') \n\n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	echo -e "=== \n\n" >> /home/pi/remoteLabs/check.python3.uv4l.running.log
	
	# send an email without log
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m " "
	
	# send an email with log

	if [[ $(uname -a) =~ atomic ]]; then
	echo "check python3 & uv4l: sending email"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m "last 100 lines of logs below:\n\n ====== $(tail -100 /home/pi/remoteLabs/AtomicSpectra/AtomicSpectra.log) \n\n ====== \n\n $(tail -100 /home/pi/remoteLabs/check.python3.uv4l.running.log)"
	fi		
	
	if [[ $(uname -a) =~ diffrac ]]; then
	echo "check python3 & uv4l: sending email"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m "last 100 lines logs below:\n\n ====== $(tail -100 /home/pi/remoteLabs/DiffractionInterference/DiffractionInterference.log) \n\n ====== \n\n $(tail -100 /home/pi/remoteLabs/check.python3.uv4l.running.log)"
	fi

	if [[ $(uname -a) =~ franck ]]; then
	echo "check python3 & uv4l: sending email"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m "last 100 lines of logs below:\n\n ====== $(tail -100 /home/pi/remoteLabs/GammaRadiation/GammaRadiation.log) \n\n ====== \n\n $(tail -100 /home/pi/remoteLabs/check.python3.uv4l.running.log)"
	fi

	if [[ $(uname -a) =~ gamma1 ]]; then
	echo "check python3 & uv4l: sending email"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m "last 100 lines of logs below:\n\n $(tail -100 /home/pi/remoteLabs/GammaRadiation/GammaRadiation.log) \n\n ======== \n\n $(tail -100 /home/pi/remoteLabs/check.python3.uv4l.running.log)"	
	fi

	if [[ $(uname -a) =~ photo ]]; then
	echo "check python3 & uv4l: sending email"
	# sendemail -f from@example.com -t to@example.com_ -s smtp@example.org:25 -u "[REMOTELABSPSCHECK] $HOSTNAME PROBLEM" -m "last 100 lines of logs below:\n\n ====== $(tail -100 /home/pi/remoteLabs/PhotoElectricEffect/PhotoElectricEffect.log) \n\n ====== \n\n $(tail -100 /home/pi/remoteLabs/check.python3.uv4l.running.log)"
	fi
	
	# private
	/bin/bash /home/pi/remoteLabs/check.python3.uv4l.running.private.sh
fi
