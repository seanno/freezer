const Freezer = require('../shared/freezer');

module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    const freezer = new Freezer(process.env, req.headers);
	const files = await freezer.listFiles();

    ctx.res = {
        // status: 200, /* Defaults to 200 */
        body: JSON.stringify(files)
    };
}
