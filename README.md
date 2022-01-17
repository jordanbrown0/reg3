# Version 3 of the REG.PRG convention registration system
## Quick Start

### To bring up a standalone installation

- Download a release wad `Reg-yyyy-mm-dd.hh.mm.ss.exe`.
- Run it.
- Click Yes that you want to install or upgrade Reg3
- A command prompt window pops up and asks you for a convention directory.
  Give a legal name for a Windows directory.
- If the directory (`C:\Users\yourname\Documents\Reg3\name`) does not exist -
  and it shouldn't - it will ask you to confirm that you want to set up a new
  installation.  Press `Y` and Enter.
- When it's done, press any key to dismiss the command prompt window.
- It will create a "Reg Svr" icon on the desktop.
- Double click that icon to start a server.
- Start a browser.  Navigate to `http://localhost`.  You will likely have to
  explicitly specify the `http://` part.
- General principles:
  - Clicking the `?` in the top right corner pops documentation on the current
    page.  It will track the current page as you move through the application.
  - Anything underlined is a key that you can press.  You can also click on
    buttons and menu items.
  - In lists, you can type to search, or use arrow keys to point at lines, or
    click on lines.  (They do not scroll.)
- Administration Configuration Global - Set convention name and start date.
- Administration Configuration Server - Give this server a human-friendly name
  and specify a range of membership number for it to allocate.
- Administration Configuration Station - Give this station a human-friendly name.
- If you have a label printer...
  - Ensure it is plugged in with drivers installed.
  - Administration Printers Manage - Select each of the printers that isn't a label
    printer, and set the "hide printer" flag.
    Select the label printer(s) and set the "label printer" flag and the
    human-friendly name.
  - Administration Printing Identify printers - if necessary to distinguish one printer
    from another.
  - Administration Configuration Station - select a label printer.
  - Administration Printing Test assigned printer - confirm that it prints.
- OR if you do not have a label printer...
  - Administration Configuration Server - set "disable printing".
