const Pusher = require("pusher");

const pusher = new Pusher({
  appId: '1072579',
  key: '1e4a066974f307cf86f1',
  secret: '215928b2620d3e5fa96d',
  cluster: 'eu',
  useTLS: true
});

module.exports = pusher;
