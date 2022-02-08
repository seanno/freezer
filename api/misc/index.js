const Freezer = require('../shared/freezer');

module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    const freezer = new Freezer(process.env, req.headers);

    misc = {
        container: freezer.getContainerName(),
        acct: freezer.getStorageAcct()
    };

    ctx.res = { body: JSON.stringify(misc) }
}