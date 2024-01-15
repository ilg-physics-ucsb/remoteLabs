This directory contains the custom parts designed and printed for the UCSB Physics Remote Labs. Parts for each remote lab were designed in Fusion 360 and 3D printed using Fused Deposition Modeling (FDM) on Prusa printers. Some labs have a primary Fusion 360 file with multiple assemblies and some files have only individual pieces.

Each lab (and general) has a sub directory with all relevant Fusion 360 files, STL files, 3MF PrusaSlicer Projects, an Gcode files. The .gCode will be for Prusa Mini+ printers with 0.4mm nozzle and include photo of the final part both alone and in its context in the setup.

Organization is as follows:
3D - Printing
  Lab
    Fusion 360 File
	STL, 3MF, GCode files derived from above Fusion file



File Structure Outline
	1. Lab Files
		a. All files associated with a specific lab will go here
		b. One sub folder for each Fusion 360 file
			i. Name Format: 'File Name' (include date edited?)
			ii. Includes a Readme which describes the relevant files
			iii. Includes Fusion 360 file
			iv. Subfolders:
				I. STL Files
				II. PrusaSlicer Projects
				III. GCode Files
		c. One additional sub folder to house all old Fusion 360 files
			i. Name Format: Old Files
			ii. Contains old Fusion 360 files
		d. Photos for each part sub directory with matching name
		e. Include videos and photos of the lab set up as a whole
	2. General Files 
		a. All files not associated with a specific lab (files used across labs)
		b. One sub folder for each Fusion 360 file
			i. Name Format: 'File Name'_YYMMDD
			ii. Includes a Readme which describes the relevant files
			iii. Includes Fusion 360 file
			iv. Subfolders:
				I. STL Files
				II. PrusaSlicer Projects
				III. GCode Files
		c. One additional sub folder to house all old Fusion 360 files
			i. Name Format: Old Files
			ii. Contains old Fusion 360 files
		d. Include videos and photos of the lab set up and the printed parts.



Sample File Structure
	1. Unprojected Footage
		a. 20703_ShorelinePark_Mini3Pro_Random_Sunset
			i. Videos
			ii. Photos
			iii. Hyperlapse
		b. 220920_Sands_Mini3Pro_PlatformHolly_Night
			i. Videos
		c. 210321_GarrapataVistaPoint_Mini_Random_Day
			i. Videos
			ii. Hyperlapse
	2. Projected Footage 
		a. Garrapata Vista Point 220814
			i. Videos
				- 210321_GarrapataVistaPoint_Mini_Random_Day
			ii. Sounds
			iii. Other Assets
			iv. Final Output
			v. Garrapata (FCPX File)




