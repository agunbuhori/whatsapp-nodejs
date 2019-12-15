const config = {
    callback_url: "callback",
    authorization_token: "12345",
    required_code: /TSL/,
    crawling_timeout: 2000,
    sanitized_code: function (string) {
        if (typeof string === 'string') {
            string = string.replace(/.*\[/, "[");
            string = string.replace(/.*\]/, "]");
        
            return string;
        }

        return string;
    },
    test_mode: false,
    reply_test_message: "Whatsapp server is working :)",
    blast_mode: false,
    blast_message_url: "",
    blast_timeout: 2000
}

module.exports = config;