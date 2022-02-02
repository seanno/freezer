class User {
    constructor(headers) {
        const hdr = headers['x-ms-client-principal'];
        const encoded = Buffer.from(hdr, 'base64');
        this.principal = JSON.parse(encoded.toString('ascii'));
    }

    getPrincipal() { return(this.principal); }
    getUserDetails() { return(this.principal.userDetails); }
    getIdentityProvider() { return(this.principal.identityProvider); }
    getRoles() { return(this.principal.userRoles); }

    hasRole(role) {
        return(getRoles().includes(role));
    }

    getUserName() {
        const details = getUserDetails();
        const ich = details.indexOf('@');
        return(ich == -1 ? details : details.substring(0, ich));
    }
}

module.exports = User;