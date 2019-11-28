const app = require('express')();
const sulla = require('sulla');
const request = require('request');
const webhook = "https://api-register.tsl-university.id/receive_message/5dddd9bec1bfdf3a09adda7d";

sulla.create().then(client => start(client));


function triggerServer(requestMessage, client) {
  request.post({url: webhook, body: JSON.stringify(requestMessage), headers: {"Content-Type": "application/json"}}, function (error, response, body) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the response status code if a response was received

      let snapshot = JSON.parse(body);

      if (response.statusCode === 200 && snapshot && snapshot.reply)
          client.sendText(requestMessage.number, snapshot.message);
  });
}

function start(client) {
  client.onMessage(message => {
    const requestMessage = {
        number: message.from,
        message: message.body
    };

    triggerServer(requestMessage, client);    
  });


  app.post("/send/:from/:message", (req, res) => {
    triggerServer({number: req.params.from, message: req.params.message});
  });
}

app.listen(2019);