const fs   = require('fs');
const path = require('path');

function main (directory) {
    directory = __dirname + '/../../' + directory;
    var normalizedPath = path.join(directory);
    let loadedFilesJson = {};
    fs.readdirSync(normalizedPath).forEach(function(file) {
        const content = require(directory + '/' + file);
        loadedFilesJson = {
            ...loadedFilesJson,
            [file.replace('.js', '')]: content
        }
    });

    return loadedFilesJson;
}


module.exports = main;
