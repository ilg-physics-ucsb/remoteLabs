# UCSB Physics Remote Labs
This is the code base for remote-controlling apparatus used for laboratory instruction in modern physics labs.  It was created to serve our students who can't come onto campus during quarantine 2020.

## Installation and Setup

At the time of writing we are using the Raspbery Pi 4 (4GB model) with Raspbian Lite Buster installed. Raspbian Lite was chosen to minimize overhead on the CPU while still using a distro design for use with UV4L.

### Raspbian Lite

The simplest way to get Raspbian Lite is to go to the [Raspberry Pi downloads](https://www.raspberrypi.org/downloads/) page and follow one of the first three links to download the imager. Choose the link based on the operating system you are running on your own computer, not the Raspberry Pi.

Once you have the imager installed simply ask it to flash Raspbian Lite onto the SD Card. You do this by clicking the select OS button and then selection other Raspbian OS's. Then select Raspbian Lite 32-Bit. 

---
#### Making SSH work

Before you put the SD card in the Pi, you will need put an empty file named ssh in the root directory of the sd card. You can do this is terminal/command prompt.

In terminal `cd` to the SD card. On OSX that is usually under /Volumes/boot. On Linux I think it is in /mnt/boot (but I don't know for sure), then run the command

```bash
sudo touch ssh
```

On Windows open a command prompt and type `<letter>:` Replace <letter> by whatever capiatl letter windows assigned to the SD Card. (Typically D or E). Then run the command

```
echo "" > ssh
```

#### Making WiFi work

You are almost ready to plug in the SD Card.  The final step is to enable ``headless'' operation of the Pi (i.e., without its own keyboard/mouse/monitor) by giving the Pi access to your WiFi when it boots. To do that you need to add one more file to the root directory of the SD card.  This file must be named [wpa_supplicant.conf](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md) 

On Windows, you can make the file in any simple text editor on your computer and then drag and drop it onto the SD card. On Mac, there can be issues when copying and pasting to a text editor and then moving it. It is best to type it out long form. The contents of the file should look like the following:
```bash
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=<Insert 2 letter ISO 3166-1 country code here>

network={
 ssid="<Name of your WiFi>"
 psk="<Password for your WiFi>"
}
```
Replacing the three entries between angle brackets < > with your information.

Now you can plug in your SD card into the Pi and boot. You should then be able to SSH into your Pi.

---
### SSH

#### Getting the IP Address
In order to connect to your Raspberry Pi, you will need to know its IP Address. To figure that out, typically log onto your router and look and the DHCP leases. How to do this varies from router to router, but it typically starts by opening a browser and typing "192.168.1.1" in the adress bar (without the quotes). If that doesn't work try "192.168.0.1" and if that doesn't work try "10.0.0.1". If none of those work try the following commands in terminal/command prompt/Powershell:

OSX/Linux
```bash
ifconfig
```

Windows
```
ipconfig \all
```
And look for somthing labeled "gateway" that should be the IP address of your router. Type that set of numbers into your browser's address bar.

Finally, if that doesn't work, google the make and model of your router.

To access your router's information typically requires a username and password. Most routers have a default that is written on the bottom of the router or available via google. If you haven't changed anything then that should be the log in information.

You will have to look around your router's website to find a list of connected devices and their IP addresses. One of them should be named "raspberrypi". Again it should look like 192.168.1.61 or something similar. (Note: you want the IPV4 address not the IPV6.)

---
#### Getting into the Pi

To SSH into your Pi use Terminal or Powershell *(not command prompt)*. Simply type the command

```bash
ssh pi@<ip_address>
```

Replacing <ip_address> with the address you found one your router's website. (Note: Make sure your Pi has been on for about a minute before you try this command.  It won't work if the Pi is still booting up.)

You will be asked for a password. The default password for raspberry pi's is the word "raspberry" without the quotes.

The terminal should then look somthing like 
```
pi@raspberrypi:~$
```
If everything went seccussfully.

---
### Configuring the Pi
Now run the command
```bash
sudo raspi-config
```
This will open a colorful window that you can navigate using the tab, enter and arrow keys.

Start by changing your password to something that you will remember. (Just press Enter on your keyboard.)

Then arrow down to "5 Interfacing Options"

You will want to do a few things in that window, but be aware that each time you make a selection it kicks you back out to the main screen and you have to go back to "5 Interfacing Options".

- Make sure the SSH is enabled.
- Then enable Remote GPIO
- Next enable the Camera
- Then enable I2C

You may want to change the Hostname of the raspberry pi so that you can identify it more easily. To do that, select "Networking" from the raspi-config page and change the hostname. It will show you a list of rules the hostname must follow. You will have to reboot the raspberry pi in order for the name change to take effect.

Finally arrow down to "8 Update" and hit Enter. 

---
### Adding I2C Bus
Many of our labs are using the Arducam Raspberry Pi Multi Camera Adapter Module V2.2 and the Adafruit DC & Stepper Motor HAT for Raspberry Pi - Mini Kit. The problem with using both of those kits is that both use I2C and have a hardware address of 0x70. Thus they conflict. To solve this we need to configure an additional I2C bus on the GPIO headers. At the time of writing (July 2020) there is an [issue](https://github.com/raspberrypi/firmware/issues/1401) with the firmware that comes on the Raspberry Pi 4B preventing us from doing this. So before you can add the code you need to run the command.

```bash
sudo rpi-update
```
This will update the firmware to solve the boot issue. Then you need to do the following

```bash
sudo nano /boot/config.txt
```

Go down to an area referencing Additional Overlays (however it can be anywhere in the file) and the the following line:

```
dtoverlay=i2c-gpio,bus=11
```

This will create a new I2C bus out of physical pins 16 & 18 (BCM 23 & 24) where 23=SDA and 24=SCL lines. For us this made it on bus 11. You can specify other pins or which bus number to use if you would like. To do this look at the /boot/overlays/README file. Ctrl-F "i2c-gpio" for instructions. You now need to reboot for changes to take effect.

```bash
sudo reboot
```

**If something should go wrong:** If you can't boot then you need take out the SD card and look at the config.txt file on another computer. You can comment out the line you added with #. If that doesn't work either than something may have gone wrong with the rpi-update. In which case it is best just to reflash the SD Card and start again. You won't want to run rpi-update, but find the file in the issue listed above and replace it in place.

Once rebooted check which bus was added to your pi by running

```bash
ls /dev
```

Then look for something i2c-11 or i2c-3. You should already have i2c-1 by default, so if that is the only one something went wrong.

**NOTE:** In order for your new pins 16 & 18 to behave properly you will need to add a pull up resistor to each pin. That is, you will need a 1.8 kOhm resistor going from pin 16 to 3.3 V rail and another 1.8 kOhm resistor going from pin 18 to the 3.3 V rail.

---
### Installing Dependencies

The remote lab software needs some programs installed in order to run. 

Start by updating the package manager and upgrading all the elements therein by running the commands
```bash
sudo apt update
sudo apt full-upgrade
```

Once that is done, perform the UV4L ARM Installation [https://www.linux-projects.org/uv4l/installation/].

First run
```bash
curl http://www.linux-projects.org/listing/uv4l_repo/lpkey.asc | sudo apt-key add -
```
Then add a line to the ```sources.list``` file. To do this simply run:

```bash
sudo nano /etc/apt/sources.list
```
Then arrow down to the last line and copy the line below and paste it into the raspberry pi terminal.

```
deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main
```

Then update agian to update the list of packages, and finally run the command to install everything we need.

```bash
sudo apt update
sudo apt install uv4l uv4l-uvc uv4l-server uv4l-webrtc uv4l-raspicam uv4l-raspicam-extras python3-pip git i2c-tools
```

Once everything is done installing we will now need to install some Python Packages that are required. Run the following command.

```bash
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower
```
---
### Getting Remote Labs files.

Now we need to get this repo onto your Pi. Just run the following command:

```bash
git clone https://github.com/ilg-physics-ucsb/remoteLabs.git
```

Then run `cd remoteLabs`

From this folder you will want to run the two commands

```bash
sudo mv uv4l-uvc.conf /etc/uv4l
sudo mv uv4l-raspicam.conf /etc/uv4l
```
---
### Running the Remote Labs

To get the controllers to run you will need to add the labcontrol directory to your PYTHONPATH. To do this first run the command:

```bash
sudo nano ~/.bashrc
```

Then add to the top of the file the following:

```
# prepend the local file containing modules to the path that PYTHON searches for imports
export PYTHONPATH="/home/pi/remoteLabs":$PYTHONPATH
```
Press Ctrl+X, then "y" then Enter/Return.

Now run the command

```bash
source ~/.bashrc
```

In order to run UV4L you need to do the following if you are using a USB camera:

```bash
sudo pkill uv4l
sudo uv4l --config-file=/etc/uv4l/uv4l-uvc.conf -d uvc --driver-config-file=/etc/uv4l/uv4l-uvc.conf --enable-server yes
```

And if you are using one of the CSI Raspicams run the following:
```bash
sudo pkill uv4l
sudo uv4l --config-file=/etc/uv4l/uv4l-raspicam.conf -d raspicam --driver-config-file=/etc/uv4l/uv4l-raspicam.conf --enable-server yes
```

Then you need to run our python controller. For example, for the photo-electric controller lab

```bash
cd ~/remoteLabs/PhotoElectricEffect
python3 photoElectricController.py
```

Now on your computer, not the Pi, point your browser to:

http://<ip_address>:5000

Where you replace <ip_address> with the Raspberry Pi's IP address.

