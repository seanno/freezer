const Freezer = require('../shared/freezer');

module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    var freezer = new Freezer(ctx);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: freezer.getContainerName()
    };
}