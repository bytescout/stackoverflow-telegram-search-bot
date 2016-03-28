// ByteScout, Copyright 2016,
// https://bytescout.com/blog/
// based on this awesome tutorial: https://mvalipour.github.io/node.js/2015/11/10/build-telegram-bot-nodejs-heroku/

var config = require('./config'); // rename config.js.example into config.js and set keys and tokens inside it
var zlib = require('zlib');

var Bot = require('node-telegram-bot-api');
var bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(config.TelegramToken);
  bot.setWebHook('https://YOUR-HEROKU-APP-ADDRESS/' + bot.token);
}
else {
  bot = new Bot(config.TelegramToken, { polling: true });
}

//var Bot = require('node-telegram-bot-api'),
//    bot = new Bot(config.TelegramToken, { polling: true });

console.log('so-search-bot server started...');

bot.onText(/(.+)$/, function (msg, match) {
    // keywords are anything typed in
  var keywords = match[1];
  var request = require("request");
      
    // request search results, unzip the response
    var reqData = {
        url: "https://api.stackexchange.com/2.2/search?order=desc&sort=creation&site=stackoverflow&key="+config.SOKey+"&intitle="+keywords,
        method:"get",
        headers: {'Accept-Encoding': 'gzip'}
    };
    // unzip
    var gunzip = zlib.createGunzip();
    var json = "";
    gunzip.on('data', function(data){
        json += data.toString();
    });
    gunzip.on('end', function(){
        // begin - parsing and sending answers
        //console.log(body);
        var parsed = JSON.parse(json);
        // return 5 first answers only
        var maxAnswers = parsed.items.length > 5 ? 5 : parsed.items.length;
        
        // sending answers
        for(var i=0;i<maxAnswers;i++){
                var formattedAnswer = ""; // set to empty
                var answer = parsed.items[i];
                //formattedAnswer = answer.title + "\n" + answer.link;
                formattedAnswer = answer.link;
                // send message
                bot.sendMessage(msg.chat.id, formattedAnswer).then(function () {
                    // reply sent!
                });
        }
        
        // send the final message
        var formattedReply = "VIEW MORE: http://stackoverflow.com/search?tab=newest&q=" + keywords;
        // send message
        bot.sendMessage(msg.chat.id, formattedReply).then(function () {
            // reply sent!
        });
        
        // end - parsing and sending answer
        
    });
    request(reqData)
        .pipe(gunzip);

});

module.exports = bot;