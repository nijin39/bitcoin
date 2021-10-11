const queryEncode = require("querystring").encode
const crypto = require('crypto')
const configs = require('../config/config.js');
const { v4: uuidv4 } = require("uuid")
const sign = require('jsonwebtoken').sign
const request = require('request-promise')

const access_key = configs.config.accessKey;
const secret_key = configs.config.secretKey;
const server_url = configs.config.serverUrl;

module.exports.getCandle = (count, market, insertDDB) => {
    const body = {
        market: market,
        count: count
    }

    const query = queryEncode(body)

    const hash = crypto.createHash('sha512')
    const queryHash = hash.update(query, 'utf-8').digest('hex')

    const payload = {
        access_key: access_key,
        nonce: uuidv4(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512',
    }

    const token = sign(payload, secret_key)

    const options = {
        method: "GET",
        url: server_url + "/v1/candles/minutes/5?" + query,
        headers: { Authorization: `Bearer ${token}` },
        json: body
    }

    request(options, (error, response, body) => {
        if (error)
            throw new Error(error)
        insertDDB(body, market);
    })
}

module.exports.getCurrentPrice = async (markets) => {
    const body = {
        markets: markets
    }
    
    const query = queryEncode(body)
    
    const hash = crypto.createHash('sha512')
    const queryHash = hash.update(query, 'utf-8').digest('hex')
    
    const payload = {
        access_key: access_key,
        nonce: uuidv4(),
        query_hash: queryHash,
        query_hash_alg: 'SHA512',
    }
    
    const token = sign(payload, secret_key)
    
    const options = {
        method: "GET",
        url: server_url + "/v1/ticker?" + query,
        headers: {Authorization: `Bearer ${token}`},
        json: body
    }

    const result = await request(options);
    return result[0].trade_price;
    
}
