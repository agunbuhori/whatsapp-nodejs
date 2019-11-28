const app = require('express')();
const sulla = require('sulla');
const request = require('request');
const webhook = "https://api-register.tsl-university.id/receive_message/5dddd9bec1bfdf3a09adda7d";

sulla.create().then(client => start(client));

function start(client) {
  client.onMessage(message => {
    const requestMessage = {
        number: message.from,
        message: message.body
    };

    request.post({url: webhook, body: JSON.stringify(requestMessage), headers: {"Content-Type": "application/json"}}, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

        let snapshot = JSON.parse(body);

        if (response && response.statusCode === 200 && response.reply)
            client.sendText(requestMessage.number, snapshot.message);
    });
  });

  app.get("/", function (req, res) {
    res.send("WhatsApp server is working fine");
  });

  app.post("/send", function (req, res) {
    client.sendText(req.query.to+"@c.us", req.query.body);
    res.send("Message has been sent");
  });
}

app.listen(2113);