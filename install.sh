#!/bin/bash
# Update pi to the latest packages
sudo apt update
sudo apt full-upgrade -y

# Install all the non-python related software that we need.
sudo apt install python3-pip git i2c-tools ufw pigpio python3-pigpio -y

# Install all the required python packages.
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower websockets

# Download Media-MTX (The webrtc streaming server). Make sure to get the linux arm64 one.
# It is currently set to download the 1.6.0 Release.
# Save it in the home directory.
#TODO: Switch to update latest version of MTX.

wget -P "/home/$USER" https://github.com/bluenviron/mediamtx/releases/download/v1.6.0/mediamtx_v1.6.0_linux_arm64v8.tar.gz
# Extract the file and delete the compressed version.
mkdir "/home/$USER/mediamtx"
tar -xvf "/home/$USER/mediamtx_v1.6.0_linux_arm64v8.tar.gz" -C "/home/$USER/mediamtx"
rm -rf mediamtx_v1.6.0_linux_arm64v8.tar.gz

# Currently there is an issue in 1.6.0 where it wants to use LibCamera.0.0, but Raspberry  Pi Bookworm,
# utilizes a later version of it. So we need to create a symbolic system link between the library file
# that mediaMTX wants to use and what is currently installed on Bookworm.
#TODO: Remove symbolic links whenever mediaMTX updates libcamera drivers.
# Start by getting the version of libcamera that is currently in bookworm.
libcameraVersion="$(ls \lib\aarch64-linux-gnu | grep libcamera.so)"
libcameraBaseVersion="$(ls \lib\aarch64-linux-gnu | grep libcamera-base.so)"

# Now link create the links
sudo ln -s "$libcameraVersion" libcamera.so.0.0
sudo ln -s "$libcameraBaseVersion" libcamera-base.so.0.0

# Zak created a default mediamtx.yml file that is set to the Raspberry Pi Camera source as
# "cam" with some adjustments to the camera settings for better streaming.
# Copy that into the mediamtx folder for use.
#TODO: Update this so we aren't copying a hard file but can change it one the fly.
cp -rf "/home/$USER/remoteLabs/mediamtx.yml" "/home/$USER/mediamtx/mediamtx.yml"

# This will add the labcontrol module, i.e. the labcontrol directory, to the python
# path so that we can import it from any python file. It first checks if it is already
# in the PYTHONPATH and then if not it adds it.
if grep -Fxq "export PYTHONPATH=\"/home/$USER/remoteLabs\":\$PYTHONPATH" "/home/$USER/.bashrc"
then
    echo "Labcontrol already added to PYTHONPATH"
else
    sudo echo "# prepend the local file containing modules to the path that PYTHON searches for imports
export PYTHONPATH=\"/home/$USER/remoteLabs\":\$PYTHONPATH" >> "/home/$USER/.bashrc"
    source "/home/$USER/.bashrc"
fi

# Move Remla to /usr/bin and make it executable so that it can be run just like any other script
sudo mv "/home/$USER/remoteLabs/setup/remla" /usr/bin
sudo chmod +x /usr/bin/remla
