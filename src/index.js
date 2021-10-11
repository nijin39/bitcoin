const request = require("request");
const ddb = require("./dao/ddb.js");
const upbit = require("./upbit/upbit.js");
const moment = require("moment");
const cron = require('node-cron');
const { WebClient } = require("@slack/web-api");

const TOKEN = "xoxb-51166302214-1750860450418-AgQKiC7ZjJzLkkgR5e3EMH1Z";
const client = new WebClient(TOKEN);
const CHANNEL_ID = "general";

let messageSentTimestamp = "";

const insertDDB = (data, market) => {
    var insertLoop = new Promise((resolve, reject) =>  { 
        data.forEach(async (element,index,array) => {
            const inputItem = ddb.createPutItemInput(element);
            await ddb.executePutItem(inputItem);
            if (index === array.length -1) resolve();
        });
    });

    insertLoop.then( async () => {
        ddb.executeScan();
        const result = await upbit.getCurrentPrice(market);
        console.log(result);
    });
}

const findMinValue = async (market) => {

    const result = ddb.createQueryInput(market, moment().subtract(2, "hours").format("YYYY-MM-DD[T]HH:mm:ss"));

    const values = await ddb.executeQuery(result);
    let minObj = values.Items.reduce((min, obj) => (min.lowPrice.N < obj.lowPrice.N) ? min : obj);
    return minObj.lowPrice.N;
}

const requestMessage = async (message) => {
    try {
      await client.chat
        .postMessage({
          channel: CHANNEL_ID,
          text: message,
        })
        .then((res) => console.log("Message Sent"));
    } catch (error) {
      console.log(error);
    }
  };

cron.schedule("*/2 * * * *", () => {
    //upbit.getCandle( 5, 'KRW-BTC', insertDDB);
    upbit.getCandle( 5, 'KRW-ETC', insertDDB);
    //upbit.getCandle( 5, 'KRW-XRP', insertDDB);

    //findMinValue("KRW-BTC").then( (data) => {console.log(data)});
    findMinValue("KRW-ETC").then( async (data) => {
        const current = await upbit.getCurrentPrice("KRW-ETC");
        console.log("Current, Lower, Boolean", current, data, Number(data)+600 < Number(current));

        if( (Number(data)+600 < Number(current)) && (messageSentTimestamp < moment().subtract(1, "hours").format("YYYY-MM-DD[T]HH:mm:ss"))) {
            await requestMessage("Buy "+current);
            messageSentTimestamp = moment().format("YYYY-MM-DD[T]HH:mm:ss")
        }
    });
});
