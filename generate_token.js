const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const secret = uuid.v4();
const user = {
    name: "Stephen Murphy",
    email: "stephendpmurphy@msn.com"
}

async function createToken(user, secret) {
    await jwt.sign(user, secret, (err, token) => {
        if( err ) {
            console.log(err);
            return;
        }
        else {
            console.log("secret: ", secret);
            console.log("token: ", token);
        }
    })
}

createToken(user, secret);