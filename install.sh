#!/bin/bash
sudo apt update
sudo apt full-upgrade -y
curl http://www.linux-projects.org/listing/uv4l_repo/lpkey.asc | sudo apt-key add -
sudo echo "deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main" >> /etc/apt/sources.list
sudo apt update
sudo apt install uv4l uv4l-uvc uv4l-server uv4l-webrtc uv4l-raspicam uv4l-raspicam-extras python3-pip git i2c-tools ufw -y
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower
#git clone https://github.com/ilg-physics-ucsb/remoteLabs.git
#sudo mv ~/remoteLabs/setup/uv4l-uvc.conf /etc/uv4l
sudo mv /home/pi/remoteLabs/setup/uv4l-raspicam.conf /etc/uv4l
sudo echo "# prepend the local file containing modules to the path that PYTHON searches for imports
export PYTHONPATH="/home/pi/remoteLabs":$PYTHONPATH" >> ~/.bashrc
source /home/pi/.bashrc
sudo mv /home/pi/remoteLabs/setup/remla.py /usr/bin
sudo chmod +x /usr/bin/remla.py