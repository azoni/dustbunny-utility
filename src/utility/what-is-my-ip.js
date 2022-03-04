const { networkInterfaces } = require('os');
let result = '';

try {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    /**
     * results looks like this:
     * {
     *   "en1": [
     *     "192.168.0.47"
     *   ]
     * }
     */
    let k = Object.keys(results);
    if (k.length) {
        result = results[k[0]]?.[0] || '';
    }
} catch (error) {}

module.exports = result;