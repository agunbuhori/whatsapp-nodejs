const sulla = require('sulla-hotfix');
const request = require('request');
const config = require('./config');
const socket = require('socket.io-client')(config.websocket_host);

function triggerServer(requestMessage, client) {
  if (config.test_mode) {
    return client.sendText(requestMessage.number, config.reply_test_message);
  } else if (requestMessage.message.match(config.required_code)) {
    return request.post({
        url: config.callback_url, 
        body: JSON.stringify(requestMessage), 
        headers: {
          "Authorization": config.authorization_token,
          "Content-Type": "application/json"
        }
      }, function (error, response, body) {
        console.log({error, body, response})

        if (error)
          return false;

        if (response.statusCode === 200) {
          let snapshot = JSON.parse(body);

          if (snapshot.reply)
            client.sendText(requestMessage.number, snapshot.message);
        }
    });
  }
}

function sanitizeMessage(message) {
  return config.sanitized_code(message);
}

sulla.create().then(client => start(client));
  async function start(client) {
    /**
     * Auto reply messages 
     * 
     * 
     * @return void
     */
    client.onMessage(message => {
      if ('string' === typeof message.body)
      const requestMessage = {
          number: message.from,
          message: sanitizeMessage(message.body)
      };

      triggerServer(requestMessage, client);    
    });

    /**
     * Crawling unreplied messages
     * 
     * if there are messages that are not answered, they will be replied automatically by the system
     * @return void
     */
    await client.getUnreadMessages(true, true, true).then(async chats => {
      let requestMessages = [];

      await chats.forEach(function (chat, i) {
        chat.messages.forEach(function (message, i) {
          if ('string' === typeof message.body && message.body.match(config.required_code)) {

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

      if (requestMessagesLength > 0) {
        setInterval(() => {
          triggerServer(requestMessages[sent], client);
          
          if (sent < requestMessagesLength-1)
            sent++;

          if (sent === requestMessagesLength-1) {
            requestMessages = [];
            sent = 0;
          }
        }, config.crawling_timeout);
      }
  });

  /**
   * If there is a message that must be sent to a number
   * 
   * @return void
   */
  socket.on("send_message", function (requestMessage) {
    if (config.blast_mode) {
      if (requestMessage.number && requestMessage.message) {
        const { number, message } = requestMessage;
        client.sendText(number, message);
      }
    }
  });
}
