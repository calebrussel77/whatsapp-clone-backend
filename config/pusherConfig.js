const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1070585",
  key: "a490cbd4671f82b47b87",
  secret: "9eaf3960b8412f9eddcc",
  cluster: "eu",
  useTLS: true,
});

module.exports = pusher;
