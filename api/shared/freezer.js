// Read about this code at http://shutdownhook.com
// MIT license details at https://github.com/seanno/shutdownhook/blob/main/LICENSE

const User = require('./user');

const { 
    ContainerClient, 
    StorageSharedKeyCredential,
    ContainerSASPermissions,
    generateBlobSASQueryParameters
} = require("@azure/storage-blob");

class Freezer {
	
    // +-------+
    // | Setup |
    // +-------+

    constructor(env, headers) {
		
        this.acct = env['STORAGE_ACCT'];
        this.key = env['STORAGE_KEY'];
        this.container = new User(headers).getUserName();

		this.credential = new StorageSharedKeyCredential(this.acct, this.key);

		const clientURL = 'https://' + this.acct + '.blob.core.windows.net/' + this.container;
		this.client = new ContainerClient(clientURL, this.credential);
    }

    getContainerName() { return(this.container); }

    // +---------------------+
    // | Shared Access Stuff |
    // +---------------------+

    async getUploadToken(name) {

        await this._ensureContainer();

        const token = generateBlobSASQueryParameters({
            containerName: this.getContainerName(),
            permissions: ContainerSASPermissions.parse("cw"),
            blobName: name, 
            expiresOn: new Date(new Date().valueOf() + 86400)
        }, this.credential);
        
        return(token.toString());
    }

    // +-----------+
    // | listFiles |
    // +-----------+

	async listFiles() {
		
		await this._ensureContainer();

		var files = {};

		for await (const blob of this.client.listBlobsFlat({ includeMetadata: true })) {
            const tier = blob.properties.accessTier;
            if (!files[tier]) files[tier] = [];
            files[tier].push(blob);
		}

        return(files);
	}
	
    // +---------+
    // | Helpers |
    // +---------+

    async _ensureContainer() {
		await this.client.createIfNotExists();
	}
}

module.exports = Freezer;
