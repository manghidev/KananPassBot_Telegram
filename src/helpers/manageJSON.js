import * as fs from 'fs';

export const writeJSON = async (data, filename) => {
    fs.writeFile(filename, JSON.stringify(data), 'utf8', function (err) {
        if (err) return console.log(err);

        console.log("JSON file has been create.");
    });
};

export const deleteJSON = async (filename) => {
    fs.unlink(filename, function (err) {
        if (err) return console.log(err);

        console.log("JSON file deleted.");
    });
};
