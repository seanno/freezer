const Freezer = require('../shared/freezer');

module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    const name = req.query.name;
    if (!name) throw 'blob name required';

    const freezer = new Freezer(process.env, req.headers);
    const url = await freezer.getDownloadUrl(name);

    ctx.res = { status: 302, headers: { Location: url } };
}