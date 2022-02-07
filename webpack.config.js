const path = require('path');

module.exports = {
    entry: './webpack/index.js',
    output: {
        filename: 'azure-storage-blob.js',
        path: path.resolve(__dirname, 'src'),
        libraryTarget: 'var',
        library: 'AzureStorageBlob'
    },
};