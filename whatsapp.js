const sulla = require('sulla-hotfix');
const request = require('request');
const config = require('./config');

function triggerServer(requestMessage, client) {
  if (config.test_mode)
    return client.sendText(requestMessage.number, config.reply_test_message);
  else if (requestMessage.message.match(config.required_code)) {
    return request.post({
        url: config.callback_url, 
        body: JSON.stringify(requestMessage), 
        headers: {
          "Authorization": config.authorization_token,
          "Content-Type": "application/json"
        }
      }, function (error, response, body) {
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
        console.log('body:', body);

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
      const requestMessage = {
          number: message.from,
          message: sanitizeMessage(message.body)
      };

      if (typeof requestMessage.message === 'string')
        triggerServer(requestMessage, client);    
    });

    /**
     * Crawling unreplied messages
     * 
     * if there are messages that are not answered, they will be replied automatically by the system
     * @return void
     */
    await client.getUnreadMessages(true, true, true).then(async chats => {
      const requestMessages = [];

      await chats.forEach(function (chat, i) {
        chat.messages.forEach(function (message, i) {
          if (typeof message.body === 'string' && message.body.match(config.required_code)) {

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
        const interval = setInterval(() => {
          triggerServer(requestMessages[sent], client);
          
          if (sent < requestMessagesLength-1)
            sent++;

          if (sent === requestMessagesLength-1)
            clearInterval(interval);
        }, config.crawling_timeout);
      }
  });
  
  if (config.blast_mode) {
    const blasts = setInterval(() => {
      request.get({
        url: config.blast_message_url, 
        headers: {
          "Authorization": config.authorization_token,
          "Content-Type": "application/json"
        }
      }, function (error, response, body) {
        if (error) {
          clearInterval(blasts);
          return false;
        }
        
        if (response.statusCode === 200) {
          let snapshot = JSON.parse(body);

          if (snapshot.message && snapshot.number) {
            let { message, number } = snapshot;
            client.sendText(number, message);
          }
        }
      });
    }, config.blast_timeout);
  }
}
