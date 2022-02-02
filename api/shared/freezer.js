const User = require('./user');

class Freezer {
    constructor(env, headers) {
        this.acct = env['STORAGE_ACCT'];
        this.key = env['STORAGE_KEY'];
        this.container = new User(headers).getUserName();
    }

    getContainerName() { return(this.container); }
}

module.exports = Freezer;
