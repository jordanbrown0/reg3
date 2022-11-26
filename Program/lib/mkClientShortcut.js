var args = WSH.Arguments;
if (args.length != 1) {
    WSH.Echo('Usage: mkClientShortcut servername');
    WSH.Quit(1);
}

var servername = args(0);

var shell = WSH.CreateObject("WScript.Shell");
var distDir = shell.SpecialFolders('MyDocuments') + '\\reg3';
var iconLocation = distDir + '\\Reg.ico';
var linkDir = shell.SpecialFolders('Desktop');
var fs = WSH.CreateObject('Scripting.FileSystemObject');

var url = 'http://'+servername;
var firefoxArgs = '-no-remote -profile '+distDir+'\\Firefox ';
var variations = [
    {
        prog: '\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: '--kiosk ' + url,
        desc: 'Edge kiosk'
    },
    {
        prog: '\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: url,
        desc: 'Edge'
    },
    {
        prog: '\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        args: '--kiosk '+url,
        desc: 'Chrome kiosk'
    },
    {
        prog: '\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        args: url,
        desc: 'Chrome'
    },
    {
        prog: '\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
        args: firefoxArgs + '--kiosk '+url,
        desc: 'Firefox kiosk (x86)'
    },
    {
        prog: '\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
        args: firefoxArgs + url,
        desc: 'Firefox (x86)'
    },
    {
        prog: '\\Program Files\\Mozilla Firefox\\firefox.exe',
        args: firefoxArgs + '--kiosk '+url,
        desc: 'Firefox kiosk'
    },
    {
        prog: '\\Program Files\\Mozilla Firefox\\firefox.exe',
        args: firefoxArgs + url,
        desc: 'Firefox'
    },
    {
        prog: '\\Program Files (x86)\\Mozilla Firefox\\bogus.exe',
        args: firefoxArgs + url,
        desc: 'Firefox bogus'
    }
];

for (i in variations) {
    var v = variations[i];

    if (!fs.FileExists(v.prog)) {
        continue;
    }
    var link =
        linkDir + '/' + servername + ' registration (via ' + v.desc + ').lnk';

    var oLink = shell.CreateShortcut(link);
    oLink.TargetPath = v.prog;
    oLink.IconLocation = iconLocation;
    oLink.Arguments = v.args;
    oLink.Save();
};
