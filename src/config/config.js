const config = require('dotenv').config();

module.exports.config = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY,
    serverUrl: process.env.SERVER_URL,
    ddbAccessKey: process.env.DDB_ACCESS_KEY,
    ddbSecretKey: process.env.DDB_SECRET_KEY,
}