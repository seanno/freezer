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
    getStorageAcct() { return(this.acct); }

    // +---------------------+
    // | Shared Access Stuff |
    // +---------------------+

    async getBlobToken(name, perms) {

        await this._ensureContainer();

        const token = generateBlobSASQueryParameters({
            containerName: this.getContainerName(),
            permissions: ContainerSASPermissions.parse(perms),
            blobName: name, 
            expiresOn: new Date(new Date().valueOf() + 86400),
            contentType: 'application/octet-stream',
            contentDisposition: 'attachment; filename=' + name
        }, this.credential);
        
        return(token.toString());
    }

    async getBlobUrl(name, perms) {
        const token = await this.getBlobToken(name, perms);
        const url = 'https://' + this.getStorageAcct() + 
        '.blob.core.windows.net/' + this.getContainerName() + 
        '/' + name + '?' + token;

        return(url);
    }

    async getUploadUrl(name) { return(this.getBlobUrl(name, 'cw')); }
    async getDownloadUrl(name) { return(this.getBlobUrl(name, 'r')); }

    // +------------+
    // | deleteFile |
    // +------------+

    async deleteFile(name) {
		await this._ensureContainer();
        await this.client.deleteBlob(name, { deleteSnapshots: 'include' });
    }

    // +----------+
    // | thawFile |
    // +----------+

    async thawFile(name) {
		await this._ensureContainer();
        const url = await this.getBlobUrl(name, 'r');
        const newBlobClient = await this.client.getBlobClient(name);
        const poller = await newBlobClient.beginCopyFromURL(url);
        return(poller.toString());
    }
    
    // +-----------+
    // | listFiles |
    // +-----------+

	async listFiles() {
		
		await this._ensureContainer();

		var files = { archive: [], active: [] };

		for await (const blob of this.client.listBlobsFlat({ includeMetadata: true })) {
            if (blob.properties.accessTier == 'Archive') { files.archive.push(blob); }
            else { files.active.push(blob); }
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
