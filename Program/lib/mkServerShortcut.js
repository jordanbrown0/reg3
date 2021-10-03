var args = WSH.Arguments;
if (args.length != 1) {
    WSH.Echo('Usage: mkServerShortcut conventiondirname');
    WSH.Quit(1);
}

var dirname = args(0);

var WSS = WSH.CreateObject("WScript.Shell");
var distDir = WSS.SpecialFolders('MyDocuments') + '/reg3/' + dirname;
var target = distDir + '/server.bat';
var link = WSS.SpecialFolders('Desktop')
    + '/' + dirname + ' registration server.lnk';
var oLink = WSS.CreateShortcut(link);
oLink.TargetPath = target;
oLink.IconLocation = distDir + '/Program/static/RegServer.ico';
oLink.Save();
