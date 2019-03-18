var request = require( 'request-promise' );


async function getStatus ( restUri, sonarToken ) {
    const options = {
        uri: restUri,
        headers: {
            'User-Agent': 'Request-Promise',
        },
        auth: {
            'user': sonarToken
        },
        json: true
    }
    const response = await request.get( options );
    return new Promise(
        async function ( resolve, reject ) {
            try {
                const response = await request.get( options );
                setTimeout(
                    function () {
                        resolve( response );
                    }, 5000 );
            }
            catch ( erro ) {
                setTimeout(
                    function () {
                        reject( erro );
                    }, 5000 );
            }
        }
    );
}


module.exports = { getStatus };