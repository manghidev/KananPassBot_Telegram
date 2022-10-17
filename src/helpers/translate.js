import translateJson from './translate.json' assert {type: 'json'};

export const translateText = async (code) => {
    return translateJson[code];
};