module.exports = async function (ctx, req) {
    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    ctx.res = {
        // status: 200, /* Defaults to 200 */
        body: 'nyi'
    };
}