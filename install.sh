#!/bin/bash

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root. Please use sudo."
  exit 1
fi

########################################################################################
############                           UPDATING SYSTEM                      ############
########################################################################################
echo "Updating the Raspberry Pi"
# Update pi to the latest packages
sudo apt update
sudo apt full-upgrade -y

########################################################################################
############                           ENABLE I2C                           ############
########################################################################################
echo "Enabling I2C on bus 1"
sudo raspi-config nonint do_i2c 1

########################################################################################
############                       INSTALLING SOFTWARE                      ############
########################################################################################
echo "Installing required software and python packages"
# Install all the non-python related software that we need.
sudo apt install python3-pip git i2c-tools ufw pigpio python3-pigpio nginx -y

# Install all the required python packages.
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower websockets typer ruamel.yaml

########################################################################################
############                           PIGPIO SETUP                         ############
########################################################################################

echo "Enabling pigpio to run on boot."
# Allow pigpiod to run on boot.
sudo systemctl enable pigpiod

########################################################################################
############                           MEDIAMTX SETUP                       ############
########################################################################################
# Download Media-MTX (The webrtc streaming server). Make sure to get the linux arm64 one.
# It is currently set to download the 1.6.0 Release.
# Save it in the home directory.
#TODO: Switch to update latest version of MTX.

echo "Installling and setting up MediaMTX server"

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
# We first need to fill in the log file location with the users name.
# Copy that into the /usr/local/etc/mediamtx.yml for use.
#TODO: Update this so we aren't copying a hard file but can change it on the fly.
sed -i "s/logFile: .*\(<user>\).*/logFile: \/home\/$USER\/remoteLabs\/logs\/mediamtx.log/" "/home/$USER/remoteLabs/setup/mediamtx.yml"
sudo cp -rf "/home/$USER/remoteLabs/setup/mediamtx.yml" "/usr/local/etc/mediamtx.yml"

# Move the mediamtx binary to the bin so we can run it.
sudo mv "/home/$USER/mediamtx/mediamtx" "/usr/local/bin"

# Move service file to systemd so that we can run it on boot.
sudo mv "/home/$USER/remoteLabs/setup/mediamtx.service" "/etc/systemd/system"
# Enable it to run on boot
sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx

echo "MediaMTX complete"

########################################################################################
############                             NGINX SETUP                        ############
########################################################################################

echo "Setting up NGINX"
# Enable nginx at start up
sudo systemctl enable nginx

# Fill in the user so that all the files link to the correct directories.
sed -i "s/<user>/${USER}/g" /home/${USER}/remoteLabs/setup/localhost.conf
# Copy to sites available
sudo cp /home/${USER}/remoteLabs/setup/localhost.conf /etc/nginx/sites-available
# System link to enabled sites
sudo ln -s /etc/nginx/sites-available/localhost.conf /etc/nginx/sites-enabled/

echo "NGINX set up Complete"

########################################################################################
############                            REMLA SETUP                         ############
########################################################################################

echo "Setting up remla"
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
sudo mv "/home/$USER/remoteLabs/setup/remla" /usr/local/bin
sudo chmod +x /usr/local/bin/remla

echo "remla complete."



########################################################################################
############                        BOOTCONFIG SETUP                        ############
########################################################################################
echo
echo "################# BEGINNING DRIVER CAMERA CONFIG ######################"
echo "Note that we currently only work with Raspberry Pi 4 from here on out!"
echo "If you are using a newer model, you will need do this manually."
echo

function warning() {
  echo
  echo -e "\e[31mWarning!\e[0m"
  echo -e "\e[31m$1\e[0m"
}

# Function to check if a line exists in a file
function line_exists() {
  local file="$1"
  local pattern="$2"
  grep -q "$pattern" "$file"
}

while true; do
  read -r -p "Do you want to continue with automatic install (Y/n)? " response

  # Check for empty input (defaulting to yes)
  if [[ -z "$response" ]]; then
    response="y"
  fi

  # Check for valid input (y/n)
  case "$response" in
    [Yy])
      echo "Continuing with installation"
      break
      ;;
    [Nn])
      echo "Exiting..."
      exit 0
      ;;
    *)
      warning "Please only respond with y or n."
      ;;
  esac
done

# Valid sensor options (lowercase)
sensors=("ov5647" "imx219" "imx477" "imx708" "imx519")
sensor_list_string=$(IFS=, ; echo "${sensors[@]}")
chosen_sensor=""

while true; do
  # Prompt user for sensor selection
  echo
  read -r -p "Which sensor are you using? Select one: [$sensor_list_string] " user_sensor

  # Check if input is empty
  if [[ -z "$user_sensor" ]]; then
    warning "Please enter a sensor selection."
    continue
  fi

  # Convert user input to lowercase for easier comparison
  user_sensor=$(tr [A-Z] [a-z] <<< "$user_sensor")

  # Check if user input matches any valid sensor (case-insensitive)
  if [[ " ${sensors[@]} " =~ " $user_sensor " ]]; then
    # Store the chosen sensor in lowercase
    chosen_sensor="$user_sensor"
    echo "Using sensor: $chosen_sensor"
    break
  else
    warning "Invalid sensor selection. Please choose from: [$sensor_list_string]"
  fi
done

# Valid camera count range
min_cameras=1
max_cameras=4

# Multiplexer options and corresponding variables
mux_options=("camera-mux-4port" "camera-mux-2port" "")

while true; do
  echo
  read -r -p "How many cameras will you use ($min_cameras-$max_cameras)? " num_cameras

  # Check if input is empty
  if [[ -z "$num_cameras" ]]; then
    warning "Please enter the number of cameras."
    continue
  fi

  # Check if input is numeric
  if [[ ! "$num_cameras" =~ ^[0-9]+$ ]]; then
    warning "Invalid input. Please enter a number between $min_cameras and $max_cameras."
    continue
  fi

  # Check if input is within valid range
  if [[ $num_cameras -ge $min_cameras ]] && [[ $num_cameras -le $max_cameras ]]; then
    break
  else
    warning "Invalid number of cameras. Please enter a number between $min_cameras and $max_cameras."
  fi
done

# Now num_cameras is accessible outside the loop

# Check if multiplexer prompt is necessary (only for 1 or 2 cameras)
if [[ $num_cameras -le 2 ]]; then
  while true; do
    echo
    read -r -p "Which multiplexer are you using?
      1. Arducam 4 port multiplexer
      2. Arducam 2 port multiplexer
      3. No multiplexer (only for single camera)
      Enter 1-3: " multiplexer_choice

    # Check if input is empty
    if [[ -z "$multiplexer_choice" ]]; then
      warning "Please enter a selection (1-3)."
      continue
    fi

    # Check if input is numeric
    if [[ ! "$multiplexer_choice" =~ ^[0-9]+$ ]]; then
      warning "Invalid input. Please enter a number between 1 and 3."
      continue
    fi

    # Check if input is within valid range
    if [[ $multiplexer_choice -ge 1 ]] && [[ $multiplexer_choice -le 3 ]]; then
      # Validate selection for No multiplexer (only for single camera)
      if [[ $multiplexer_choice -eq 3 ]] && [[ $num_cameras -eq 2 ]]; then
        warning "You selected 'No multiplexer' but have 2 cameras. Please select a valid option for your number of cameras."
        # Restart the outer loop to get a valid number of cameras
        continue
      fi
      # Valid selection, assign corresponding multiplexer variable
      multiplexer=${mux_options[$((multiplexer_choice - 1))]}
      break
    else
      warning "Invalid selection. Please enter a number between 1 and 3."
    fi
  done
else
  # Assume camera-mux-4port for more than 2 cameras
  echo
  echo "Number of cameras is greater than 2. Assuming Arducam 4 Port Multiplexer"
  multiplexer="camera-mux-4port"
fi

# Updating the boot/firmware/config.txt file
# Create a backup of config.txt (replace .bak with your preferred extension)
cp /boot/firmware/config.txt /boot/firmware/config.txt.bak
echo "Created backup: /boot/firmware/config.txt.bak"

# Set camera_auto_detect based on multiplexer presence
if [[ -n "$multiplexer" ]]; then
  sed -i "s/camera_auto_detect=.*/camera_auto_detect=0/" /boot/firmware/config.txt
else
  sed -i "s/camera_auto_detect=.*/camera_auto_detect=1/" /boot/firmware/config.txt
fi

# Build the search pattern for the dtoverlay line
pattern="dtoverlay=(${sensors[@]}|camera-mux-(2|4)port)"

# Check if a dtoverlay line already exists
if line_exists /boot/firmware/config.txt "$pattern"; then
  # Line exists, update the value based on user input
  if [[ -z "$multiplexer" ]]; then
    # No multiplexer, set to just the sensor
    sed -i "s/$pattern/dtoverlay=$chosen_sensor/" /boot/firmware/config.txt
  else
    # Use multiplexer with sensor and camera number(s)
    # Build sensor list based on num_cameras
    sensor_list="$multiplexer"
    for (( i=0; i<$num_cameras; i++ )); do
      cam_num="cam$i"
      sensor_list="$sensor_list,$cam_num-$chosen_sensor"
    done
    sed -i "s/$pattern/dtoverlay=$sensor_list/" /boot/firmware/config.txt
  fi
else
  # Line doesn't exist, add a new line with the value
  if [[ -z "$multiplexer" ]]; then
    echo "dtoverlay=$chosen_sensor" >> /boot/firmware/config.txt
  else
    # Use multiplexer with sensor and camera number(s)
    sensor_list="$multiplexer"
    for (( i=0; i<$num_cameras; i++ )); do
      cam_num="cam$i"
      sensor_list="$sensor_list,$cam_num-$chosen_sensor"
    done
    echo "dtoverlay=$sensor_list" >> /boot/firmware/config.txt
  fi
fi

echo "Config.txt updated successfully."

echo
echo "Installation successfully complete!"

while true; do
  echo
  read -r -p "A reboot is required for everything to take effect. Do you want to reboot now (Y/n)? " response

  # Check for empty input (defaulting to yes)
  if [[ -z "$response" ]]; then
    response="y"
  fi

  # Check for valid input (y/n)
  case "$response" in
    [Yy])
      echo "Rebooting"
      break
      ;;
    [Nn])
      echo "Exiting..."
      exit 0
      ;;
    *)
      warning "Please only respond with y or n."
      ;;
  esac
done

sudo reboot now



