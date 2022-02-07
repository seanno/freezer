const Freezer = require('../shared/freezer');

module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    const freezer = new Freezer(process.env, req.headers);
    const container = await freezer.getContainerName();

    ctx.res = { body: container };
}
