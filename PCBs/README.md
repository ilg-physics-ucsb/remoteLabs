# Remla PCB Design Principles

This is a very general PCB prototyping tutorial for beginners. If you have designed and prototyped PCBs before and did not have much trouble with it, skip.

## Design Software

We use JLC's EasyEDA tool to design PCBs due to its beginner friendly UI and great manufacturing/prototyping integration.
We have an account for lab use only: <remotelabs@physics.ucsb.edu>

## Design Steps

### Preparation

- Identify your problem.
- Prepare a brief circuit diagram.
- Research IC/component options.
- Download EasyEDA.

### Make a PCB

- Start new EDA project.
- Add a schematic and draw out the circuit.
- **ALWAYS check the circuit before continuing.**
- Add a layout file and do some routing.
- Make sure you know your circuit's electrical charachteristics and add design rules if necessary.
- **ALWAYS run DRC as you design your layout.**

> DRC stands for Design Rule Check. It is vital that some rules are met so that certain manufacturing steps can proceed without problems. It is also important that stricter rules are followed to ensure electrical characteristics align with our design goal (e.g. wider traces for lines carring significant current, no 90 deg angles for high speed signal lines, etc.).

> Note: You must refresh the layout every time you make new changes to the circuit schematic to make sure changes are updatd in the layout file.

- Check the circuit again and make sure the layout matches your schematic and component placements do not overlap.
- If PCB assembly (PCBA) is in order, check component suppliers and serial numbers to make sure they are indeed the components you want.
- Export design files: Gerber (PCB layout), BOM (bill of materials), PickAndPlace (assembly coordinates).

> Note: BOM and PickAndPlace files are only necessary if assembly is in order.

### Save Your Progress

- Save your project (you can export the EDA's .epro project file) to the repository as well as any exported prototyping files in the last step.

### Place an Order

- Login to JLC with <remotelabs@physics.ucsb.edu>.
- Upload the exported files specified above.
- Choose manufacturing parameters. Common manufacturing parameters are the cheapest as they are produced in mass.
- Place the order and notify admin to pay for the order.
- Wait for about 2 weeks.
- Pick up the package at physics logistics warehouse in Broida.

### Testing Your PCB

**DO NOT plug in your untested circuit to a working circuit yet!**

- Check powerlines and their polarity.

> If your circuit requires external power supply or has its own voltage regulations, check if power lines are connected and if all power circuit testpoints can produce the specified voltages.

- Check connectivity in vital signal lines
- If things look good at this point, pray to the almighty god of your choice and plug in your board to a **non-production** test circuit.
- Check software compatibility on the **non-production** testbench.
- If everything functions in all modes of operation, thank your god of choice and proceed to upgrading all applicable setups with your shiny new boards.

### Production Deployment

- Shutdown the host and disconnect power safely to avoid transient bursts.
- Plug in your new board.
- **Reboot host and update accomodating software.**
- Start server process.

## When Things Go South

**Please pay extra attention in this section if you are new to electrical engineering or have not burnt a circuit before.**

If the design rules are followed, there should not be damage to the production environment or significant hazard. However, if it is the case, do not panic. **Remember that yours and everyone in the lab's safety is the top priority.**

With DRC checks and circuit diagram checks in place during the design process, it is unlikely that catastrophic failures will occur. However, remember that electrical failures can cause severe safty problems.

### Hardware Failure

An error in the hardware can be identified by **extream mechanical response, burnt smell, smoke, sparks, abnormal heat in the circuit, or the host hardware becoming irresponsive, etc..**. Avoid touching hot or buring components directly and rememeber **shorted wires become extreamly hot even if they don't look like it**!

- Disconnect all power to the setup immediately.
- Extinguish fires if there is any and remove flammmable materials from site.
- Wait for the setup to cool down.
- Examine the remains and identify points of failure.
- Check schematic and layout to identify the error in the circuit.
- Go back to fix errors and make a new PCB.

> Sometimes small hardware errors can be rectified by manually making jumper routes or disconnecting nodes by cutting the copper layer in the PCB. In this case, it may not be necessary to reorder a new PCB. However, **ALWAYS document this failure** and fix the shematics. 

### Software Failure

Software failures can be identified by **abnormal mechanical response, host software warnings and errors, host software becoming irresponsive, etc..**
Errors in the software can occationaly cascade into hardware failures! Therefore, depending on the severity, disconnect power if necessary and revise software in a different environment.

- Revise software in a safe environment or a testbench.
- Check software version.
- Check driver software compatibility.
- Make changes to your software and go back to step 1 in software failure handling.
- When error is fixed, go back to Production Deployment.
