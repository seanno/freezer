// Read about this code at http://shutdownhook.com
// MIT license details at https://github.com/seanno/shutdownhook/blob/main/LICENSE

const User = require('./user');

const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

class Freezer {
	
    constructor(env, headers) {
		
        this.acct = env['STORAGE_ACCT'];
        this.key = env['STORAGE_KEY'];
        this.container = new User(headers).getUserName();

		this.credential = new StorageSharedKeyCredential(this.acct, this.key);

		const clientURL = 'https://' + this.acct + '.blob.core.windows.net/' + this.container;
		this.client = new ContainerClient(clientURL, this.credential);
    }

    getContainerName() { return(this.container); }

	async listFiles() {
		
		await _ensureContainer();

		var files = [];

		for await (const blob of this.client.listBlobsFlat()) {
			files.push(blob.name);
		}

		return(files);
	}
	
	async _ensureContainer() {
		await this.client.createIfNotExists();
	}
}

module.exports = Freezer;
