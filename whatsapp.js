const sulla = require('sulla-hotfix');
const request = require('request');
const webhook = "https://api-register.tsl-university.id/receive_message/5dddd9bec1bfdf3a09adda7d";

sulla.create().then(client => start(client));

function triggerServer(requestMessage, client) {
  if (requestMessage.message.match(/TSL/))
  
  request.post({url: webhook, body: JSON.stringify(requestMessage), headers: {"Content-Type": "application/json"}}, function (error, response, body) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the response status code if a response was received

      if (response.statusCode === 200) {
        let snapshot = JSON.parse(body);
        if (snapshot.reply)
          client.sendText(requestMessage.number, snapshot.message);
      }
  });
}

function sanitizeMessage(message) {
  if (typeof message === 'string') {
    message = message.replace(/.*TSL/, "TSL");
    message = message.replace(/\].*/, "]");
    return message;
  }

  return message;
}

async function start(client) {
  client.onMessage(message => {
    const requestMessage = {
        number: message.from,
        message: sanitizeMessage(message.body)
    };

    if (typeof requestMessage.message === 'string')
      triggerServer(requestMessage, client);    
  });

    await client.getUnreadMessages(true, true, true)
    .then(async chats => {
      const requestMessages = [];
      await chats.forEach(function (chat, i) {
          chat.messages.forEach(function (message, i) {
            if (typeof message.body === 'string' && message.body.match(/TSL\_/)) {
              const requestMessage = {
                  number: message.from._serialized,
                  message: sanitizeMessage(message.body)
              };

              requestMessages.push(requestMessage);
            }
          });
      });

      let requestMessagesLength = requestMessages.length;
      let sent = 0;

      setInterval(() => {
        triggerServer(requestMessages[sent], client);
        if (sent < requestMessagesLength)
          sent++;
      }, 2000);
    });
}
