const { 
	BlobServiceClient,
	BlockBlobClient,
	newPipeline 
} = require("@azure/storage-blob");

module.exports = {
	newBlockBlobClient: function(url) {
		return(new BlockBlobClient(url, newPipeline()));
	}
}

