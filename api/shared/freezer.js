// Read about this code at http://shutdownhook.com
// MIT license details at https://github.com/seanno/shutdownhook/blob/main/LICENSE

const User = require('./user');
const CryptoJS = require('crypto-js');
const fetch = require('node-fetch');

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

    getBaseBlobUrl(name) {
        return('https://' + this.getStorageAcct() + 
               '.blob.core.windows.net/' + this.getContainerName() + 
               '/' + name);
    }

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

    async getAuthenticatedBlobUrl(name, perms) {
        const token = await this.getBlobToken(name, perms);
        return(this.getBaseBlobUrl(name) + '?' + token);
    }

    async getUploadUrl(name) { return(this.getAuthenticatedBlobUrl(name, 'cw')); }
    async getDownloadUrl(name) { return(this.getAuthenticatedBlobUrl(name, 'r')); }

    // +------------+
    // | deleteFile |
    // +------------+

    async deleteFile(name) {
		await this._ensureContainer();
        await this.client.deleteBlob(name, { deleteSnapshots: 'include' });
    }

    // +-----------+
    // | listFiles |
    // +-----------+

	async listFiles() {
		
		await this._ensureContainer();

		var files = { archive: [], active: [] };

		for await (const blob of this.client.listBlobsFlat({ 
            includeMetadata: true, 
            includeCopy: true })) {
                
            if (blob.properties.accessTier == 'Archive') { 
                const archiveStatus = blob.properties.archiveStatus;
                if (archiveStatus && archiveStatus.startsWith('rehydrate-pending')) {
                    // currently thawing; we consider this a special case of 'active'
                    blob.thawing = true;
                    files.active.push(blob);
                } 
                else {
                    // archive
                    files.archive.push(blob); 
                }
            } 
            else { 
                // active
                files.active.push(blob); 
            }
		}

        files.archive.sort(this.sortDatesDescending);
        files.active.sort(this.sortDatesDescending);

        return(files);
	}

    sortDatesDescending(a, b) {
        const msA = new Date(a.properties.createdOn).getTime();
        const msB = new Date(b.properties.createdOn).getTime();
        return(msB - msA);
    }
	
    // +----------+
    // | thawFile |
    // +----------+

    // See https://stackoverflow.com/questions/69668784/authorization-of-azure-storage-service-rest-api-for-next-js-with-node-js-server
    // and lots of discussion around it ... seriously Microsoft, this is ridiculous.

    async thawFile(name) {
		await this._ensureContainer();

        const srcBlobName = encodeURIComponent(name);
        const srcBlobUrl = this.getBaseBlobUrl(srcBlobName);
        const dstBlobName = 'thawed-' + srcBlobName;
        const dstBlobUrl = this.getBaseBlobUrl(dstBlobName);

        const msTime = new Date().toUTCString();
        const version = '2020-10-02';

        const canonHeaders = 'x-ms-access-tier:Cool\n' +
                             'x-ms-copy-source:' + srcBlobUrl + '\n' +
                             'x-ms-date:' + msTime + '\n' +
                             'x-ms-version:' + version + '\n';

        const canonResource = '/' + this.acct + '/' + this.container + '/' + dstBlobName;

        const strToSign = 'PUT\n\n\n\n\n\n\n\n\n\n\n\n' + canonHeaders + canonResource;
        const secret = CryptoJS.enc.Base64.parse(this.key);
        const hash = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(strToSign, secret));
        const auth = 'SharedKey ' + this.acct + ':' + hash;

        const response = await fetch(dstBlobUrl, {
            method: 'PUT',
            headers: {
                'x-ms-access-tier': 'Cool',
                'x-ms-copy-source': srcBlobUrl,
                'x-ms-date': msTime,
                'x-ms-version': version,
                'Authorization': auth
            }
        });

        return(response.ok);
    }
    
    // +---------+
    // | Helpers |
    // +---------+

    async _ensureContainer() {
		await this.client.createIfNotExists();
	}
}

module.exports = Freezer;
