const AWS = require('aws-sdk');
const configs = require('../config/config.js');

const region = 'us-east-1';
const dynamoDbClient = createDynamoDbClient(region);

const scanInput = createScanInput();

// executeScan(dynamoDbClient, scanInput).then(() => {
//     console.info('Scan API call has been executed.')
//   }
// );

function createDynamoDbClient(regionName) {
  AWS.config.update({region: regionName});
  // Use the following config instead when using DynamoDB Local
  AWS.config.update({region: 'localhost', endpoint: 'http://localhost:8000', accessKeyId: configs.config.ddbAccessKey, secretAccessKey: configs.config.ddbSecretKey});
  return new AWS.DynamoDB();
}

function createScanInput() {
  return {
    "TableName": "candle",
    "ConsistentRead": false
  }
}

module.exports.createPutItemInput = (element) => {
    return {
      "TableName": "candle",
      "Item": {
        "marketCode": {
          "S": element.market
        },
        "timestamp": {
          "S": element.candle_date_time_kst
        },
        "lowPrice": {
          "N": String(element.low_price)
        },
        "highPrice": {
          "N": String(element.high_price)
        },
        "accTradeVolume": {
          "N": String(element.candle_acc_trade_volume)
        }
      }
    }
  }

module.exports.createQueryInput = (market, timestamp) => {
    return {
      "TableName": "candle",
      "ScanIndexForward": true,
      "ConsistentRead": false,
      "KeyConditionExpression": "#278e0 = :278e0 And #278e1 >= :278e1",
      "ExpressionAttributeValues": {
        ":278e0": {
          "S": market
        },
        ":278e1": {
          "S": timestamp
        }
      },
      "ExpressionAttributeNames": {
        "#278e0": "marketCode",
        "#278e1": "timestamp"
      }
    }
  }

module.exports.executeQuery = async (queryInput) => {
    // Call DynamoDB's query API
    try {
      const queryOutput = await dynamoDbClient.query(queryInput).promise();
      return queryOutput;
      // Handle queryOutput
    } catch (err) {
      handleQueryError(err);
    }
  }

module.exports.executePutItem = async (putItemInput) => {
    try {
        const putItemOutput = await dynamoDbClient.putItem(putItemInput).promise();
        console.info('Successfully put item.');
        // Handle putItemOutput
    } catch (err) {
        handlePutItemError(err);
    }
}

module.exports.executeScan = async () => {
  try {
    const scanOutput = await dynamoDbClient.scan(scanInput).promise();
    console.info(scanOutput.Count);
  } catch (err) {
    handleScanError(err);
  }
}

function handleScanError(err) {
  if (!err) {
    console.error('Encountered error object was empty');
    return;
  }
  if (!err.code) {
    console.error(`An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(err)}`);
    return;
  }
  // here are no API specific errors to handle for Scan, common DynamoDB API errors are handled below
  handleCommonErrors(err);
}

function handleCommonErrors(err) {
  switch (err.code) {
    case 'InternalServerError':
      console.error(`Internal Server Error, generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'ProvisionedThroughputExceededException':
      console.error(`Request rate is too high. If you're using a custom retry strategy make sure to retry with exponential back-off. `
        + `Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index. Error: ${err.message}`);
      return;
    case 'ResourceNotFoundException':
      console.error(`One of the tables was not found, verify table exists before retrying. Error: ${err.message}`);
      return;
    case 'ServiceUnavailable':
      console.error(`Had trouble reaching DynamoDB. generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'ThrottlingException':
      console.error(`Request denied due to throttling, generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'UnrecognizedClientException':
      console.error(`The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying. `
        + `Error: ${err.message}`);
      return;
    case 'ValidationException':
      console.error(`The input fails to satisfy the constraints specified by DynamoDB, `
        + `fix input before retrying. Error: ${err.message}`);
      return;
    case 'RequestLimitExceeded':
      console.error(`Throughput exceeds the current throughput limit for your account, `
        + `increase account level throughput before retrying. Error: ${err.message}`);
      return;
    default:
      console.error(`An exception occurred, investigate and configure retry strategy. Error: ${err.message}`);
      return;
  }
}
