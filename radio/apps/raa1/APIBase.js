const express = require('express');

class APIBase {
    constructor(port) {
        this._port = port;
        this._webApp = express();
    }

    register0(callback) {
        this.registerCalls();
        this._webApp.listen(this._port, callback);
    }

    // Implemented in subclasses
    registerCalls() {
    }
}

module.exports = APIBase;
