module.exports = async function (ctx, req) {
    context.log('entering ' + ctxt.executionContext.functionName + 
                ' (' + ctx.executionContext.invocationId + ')');

    var responseBody = 'Environment:\n\n';

    for (const item in process.env) {
        responseBody = responseBody + item + '\n';
    }
    
    ctx.res = {
        // status: 200, /* Defaults to 200 */
        body: responseBody
    };
}