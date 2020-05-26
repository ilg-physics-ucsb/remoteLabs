# UCSB Physics Remote Labs
This is the code base for remote-controlling apparatus used for laboratory instruction in modern physics labs.  It was created to serve our students who can't come onto campus during quarantine 2020.

## Installation and Setup

At the time of writing we are using the Raspbery Pi 4 (4GB model) with Raspbian Lite Buster installed. Raspbian Lite was chosen to minimize overhead on the CPU while still using a distro design for use with UV4L.

### Raspbian Lite

The simplest way to get Raspbian Lite is to go to the [Raspberry Pi downloads](https://www.raspberrypi.org/downloads/) page and follow one of the first three links to download the imager. Choose the link based on the operating system you are running on your own computer, not the Raspberry Pi.

Once you have the imager installed simply ask it to flash Raspbian Lite onto the SD Card. 

#### Making SSH work

Before you put the SD card in the Pi, you will need put an empty file named ssh in the root directory of the sd card. You can do this is terminal/command prompt.

In terminal `cd` to the SD card. On OSX that is usually uner /Volumes/boot. On Linux I think it is in /mnt/boot (but I don't know for sure), then run the command

```bash
touch ssh
```

On Windows open a command prompt and type `<letter>:` Replace <letter> by whatever capiatl letter windows assigned to the SD Card. (Typically D or E). Then run the command

```
echo "" > ssh
```

#### Making WiFi work

You are almost ready to plug in the SD Card.  The final step is to enable ``headless'' operation of the Pi (i.e., without its own keyboard/mouse/monitor) by giving the Pi access to your WiFi when it boots. To do that you need to add one more file to the root directory of the SD card.  This file must be named [wpa_supplicant.conf](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md) 

You can make the file in any simple text editor on your computer and then drag and drop it onto the SD card. The contents of the file should look like the following:
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

#### Getting into the Pi

To SSH into your Pi use Terminal or Powershell *(not command prompt)*. Simply type the command

```bash
ssh pi@<ip_address>
```

Replacing <ip_address> with the address you found from before. You Pi should be on for about a minute before you try this command on your computer.

It will ask you for a password. The default password for raspberry pi's is the word "raspberry" without the quotes.

The terminal should then look somthing like 
```
pi@raspberrypi:~$
```
If everything went seccussfully.

### Configuring the Pi
Now run the command
```bash
sudo raspi-config
```
This will open a colorful window that you can use the arrow keys and enter to navigate.

Start by changing your password to something that you will remember. Just press Enter on yoru keyboard.

Then arrow down to "5 Interfacing Options"

You will want to do a few things int hat window, but each down you make a selection it kicks you back out to the main screen. Just go back to interfacing options.

- Make sure the SSH is eneabled.
- Then enable Remote GPIO

Finally arrow down to update and hit Enter. 

### Installing Dependencies

The remote labs needs some programs to be installed before it can run. Mostly UV4L, but a couple of other things as well.

Start by running the commands
```bash
sudo apt update
sudo apt upgrade
```

Once that is done want to follow the (UV4l ARM Installation)[https://www.linux-projects.org/uv4l/installation/].

The summary of commands is the following. First run
```bash
curl http://www.linux-projects.org/listing/uv4l_repo/lpkey.asc | sudo apt-key add -
```
Then you will need to add a line to file. To do this simply run:

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
sudo apt install uv4l uv4l-uvc uv4l-server uv4l-webrtc python3-pip git
```

Once everything is done installing we will now need to install some Python Packages that are required. Run the following command.

```bash
pip3 install RPistepper pyvisa pyvisa-py adafruit-circuitpython-motorkit python-tplink-smarthome dlipower
```

### Getting Remote Labs files.

Now we need to get this repo onto your Pi. Just run the following command:

```bash
git clone https://github.com/ilg-physics-ucsb/remoteLabs.git
```

Then run `cd remoteLabs`

From this folder you will want to run

```bash
sudo mv uv4l-uvc.conf /etc/uv4l
```

### Running the Remote Labs
In order to run UV4L you need to do the following:

```bash
sudo pkill uv4l
sudo uv4l --config-file=/etc/uv4l/uv4l-uvc.conf -d uvc --driver-config-file=/etc/uv4l/uv4l-uvc.conf --enable-server yes
```

Then you need to run our python controller. 

```bash
python3 photoElectricController.py
```

Now on your computer, not the Pi, point your browser to:

http://<ip_address>:5000

Where you replace <ip_address> with the Raspberry Pi's IP address.

