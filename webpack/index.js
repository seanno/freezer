const { 
	AnonymousCredential,
	BlobServiceClient,
	BlockBlobClient,
	newPipeline 
} = require("@azure/storage-blob");

module.exports = {
	newBlockBlobClient: function(url) {
		return(new BlockBlobClient(url, newPipeline()));
	},
	newBlockBlobClientOptions: function(url, storagePipelineOptions) {
		return(new BlockBlobClient(url, new AnonymousCredential(), storagePipelineOptions));
	}
}

