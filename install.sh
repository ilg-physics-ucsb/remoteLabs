#!/bin/bash
sudo apt update
sudo apt full-upgrade -y
curl https://www.linux-projects.org/listing/uv4l_repo/lpkey.asc | sudo apt-key add -
if grep -Fxq "deb https://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main"  /etc/apt/sources.list
then
    echo "UV4L Repo already found"
else
    sudo echo "deb https://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main" >> /etc/apt/sources.list
fi
sudo apt update
sudo apt install uv4l uv4l-uvc uv4l-server uv4l-webrtc uv4l-raspicam uv4l-raspicam-extras python3-pip git i2c-tools ufw pigpio python3-pigpio -y
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower websockets
#git clone https://github.com/ilg-physics-ucsb/remoteLabs.git
#sudo mv ~/remoteLabs/setup/uv4l-uvc.conf /etc/uv4l
sudo cp /home/pi/remoteLabs/setup/uv4l-raspicam.conf /etc/uv4l
if grep -Fxq "export PYTHONPATH=\"/home/pi/remoteLabs\":\$PYTHONPATH" /home/pi/.bashrc
then
    echo "Labcontrol already added to PYTHONPATH"
else
    sudo echo "# prepend the local file containing modules to the path that PYTHON searches for imports
export PYTHONPATH=\"/home/pi/remoteLabs\":\$PYTHONPATH" >> /home/pi/.bashrc
    source /home/pi/.bashrc
fi
sudo mv /home/pi/remoteLabs/setup/remla /usr/bin
sudo chmod +x /usr/bin/remla
