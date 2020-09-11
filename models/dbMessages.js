const mongoose = require("mongoose");

const messageContentSchema = new mongoose.Schema({
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
});

module.exports = mongoose.model("messageContent", messageContentSchema);
