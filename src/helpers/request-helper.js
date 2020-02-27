const request = require('request');

module.exports.makeRequest = (options) => {
    return new Promise((resolve, reject) => {
        try {
            request.post(options, (error, response, body) => {
                if (error) reject(error);
                resolve(JSON.parse(body));
            });
        } catch (e) {
            reject(e);
        }
    });
}