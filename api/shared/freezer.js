class Freezer {
    constructor(ctx) {
        this.acct = ctx.env['STORAGE_ACCT'];
        this.key = ctx.env['STORAGE_KEY'];
        this.container = parseUserContainer(ctx.request.headers);
    }

    #parseUserContainer(headers) {
        const hdr = headers['x-ms-client-principal'];
        const encoded = Buffer.from(hdr, 'base64');
        const principal = JSON.parse(encoded.toString('ascii'));
        return(principal.userDetails)
    }

    getContainerName() {
        return(this.container;)
    }

}

module.exports = Freezer;
