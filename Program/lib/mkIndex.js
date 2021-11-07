import fs from 'fs';
import fspromises from 'fs/promises';
import readline from 'readline';

var index = {};

async function indexFile(name) {
    console.log('processing '+name);
    const fileStream = await fs.createReadStream(name);
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    var title;
    var keys = [];
    for await (const line of rl) {
        var titleMatch = line.match(/<title>(.*)<\/title>/);
        if (titleMatch) {
            title = titleMatch[1];
        }
        var keyMatch = line.match(/<!-- INDEX: *(.*[^ ]) *-->/);
        if (keyMatch) {
            keys.push(keyMatch[1]);
        }
    }
    keys.forEach(function (k) {
        if (!index[k]) {
            index[k] = [];
        }
        index[k].push({ name: name, title: title });
    });
    fileStream.destroy();
}

function writeIndexHTML(outfn) {
    var lines = [];
    var keys = Object.keys(index).sort();
    keys.forEach(function (k) {
        var line = '<div class="Index">' + k + ' - ';
        var keysep = '';
        index[k].forEach(function (ref) {
            line += keysep + '<a href="' + ref.name + '">' + ref.title + '</a>';
            keysep = ', ';
        });
        line += '</div>';
        lines.push(line);
    });
    fs.writeFileSync(outfn, lines.join('\n') + '\n');
}

async function main() {
    var outname = 'Built/IndexEntries.html';

    fs.rmSync(outname, {force: true});
    const dir = await fspromises.opendir('.');
    for await (const dirent of dir) {
        if (dirent.name.endsWith('.html')) {
            await indexFile(dirent.name);
        }
    }
    writeIndexHTML(outname);
}

await main();
