Version 3 of the REG.PRG convention registration system

Directory layout:

BASE
	A directory containing per-convention directories.  For the moment, it is probably necessary that none of the ancestral or per-convention directories have spaces in their names.  It is not yet clear how this location is defined.  Ideal would be to allow the user to specify a location at installation time, but that requires creating a UI.  For now, it's USER/Documents/Reg3.
	
BASE/node-vXX.YY.z-win-x86
	Node.js installation, trimmed to remove npm.  This installation is shared between conventions.

BASE/CONVENTION
	This directory, the root of the source tree.  One copy per convention.
	Overhead required to be in the root:  .gitignore, et cetera.
	Batch files intended for user consumption.

BASE/CONVENTION/Documentation
	Like it says

BASE/CONVENTION/Program
	The software itself.
	Batch files intended for developer use.
	Development overhead (package*.json).

BASE/CONVENTION/Program/Data
	The actual convention data.
	reg.json - global data.  Note that, e.g., per-server configuration is global data, as entries in the server table.
	serverID.json - the ID for this server.
	
BASE/CONVENTION/Program/imported
	Binaries imported from other places.  Notably, the 7-Zip command line and self-extracting tools.
	
BASE/CONVENTION/Program/lib
	Tools and data files intended for implementation of various components - currently, the installation subsystem.
	NodeVer.bat contains the version number of Node.js used; this is used in finding and managing BASE/node-vXX.YY.Z-win-x86.
	
BASE/CONVENTION/Program/node_modules
	Node.js modules.  Imported.  No custom files here.  The one file that we have currently customized is myclinic-drawer-printer/drawer.cc, but that's copied from BASE/CONVENTION/Program/src.
	
BASE/CONVENTION/Program/server
	The implementation of the server.
	
BASE/CONVENTION/Program/src
	Miscellaneous source files.  Currently only drawer.cc.
	
BASE/CONVENTION/Program/static
	The implementation of the client, including JavaScript, HTML, and CSS.
	
BASE/CONVENTION/Program/Temp
	Developer sandbox.
	
BASE/CONVENTION/Program/Unused
	Components of historical or future interest.
	