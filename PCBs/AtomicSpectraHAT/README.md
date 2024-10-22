# Atomic Spectra HAT

> This is a PCB design for the Atomic Spectra Setup, it is designed to be a HAT that can be installed on top of a Raspberry Pi 4.

## This PCB integrates 4 main functions

- 12V to 5V power generation and filtering for the 5V smaller stepper motors.
- Camera board routing to the RPi.
- S42C Encoded Stepper motor power filter and connector routing.
- Ambient LED power pass by switch.

## Board I/O

- 12V power (XH-A) input.
- 12V power (XH-A) pass by output.
- Standard 40 pin RPi connector (the connector itself needs to be sodered upside down with female facing towards the RPi since this board goes on top of it.)
- 2x S42C connectors (XH-6A)
- 2 pin female ambient LED pass by
- 26 pin camera board connector

## Implementation

The 12V-5V power conversion is implemented with the Texas Insturment TPS630701RNMR buck-boost converter.
