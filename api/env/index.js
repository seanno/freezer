module.exports = async function (ctx, req) {

    ctx.log('entering ' + ctx.executionContext.functionName + 
            ' (' + ctx.executionContext.invocationId + ')');

    var responseBody = 'Environment:\n\n';

    for (const item in process.env) {
        responseBody = responseBody + '\t' + item + ': ' + process.env[item] + '\n';
    }

    responseBody = responseBody + '\nHeaders:\n\n';

    for (const item in req.headers) {
        responseBody = responseBody + '\t' + item + ': ' + req.headers[item] + '\n';
    }
    
    ctx.res = {
        // status: 200, /* Defaults to 200 */
        body: responseBody
    };

}