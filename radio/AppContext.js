class AppContext {
    static getInstance(contextTypeName) {
        if (contextTypeName) {
            if (!AppContext._instance.constructor.name.includes(contextTypeName)) {
                throw Error('AppContext of type ' + contextTypeName + ' does not exist');
            }
        }
        return AppContext._instance;
    }

    constructor() {
        AppContext._instance = this;
    }

    get CWD() {
        return this._cwd;
    }

    get Logger() {
        return this._logger;
    }

    get ObjectBuilder() {
        return this._objectBuilder;
    }

    get Config() {
        return this._conf;
    }
}

module.exports = AppContext;
