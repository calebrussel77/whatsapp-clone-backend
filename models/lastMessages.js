const mongoose = require("mongoose");

const lastMessagesSchema = new mongoose.Schema({
  roomName: String,
  message: String,
});

module.exports = mongoose.model("lastMessage", lastMessagesSchema);
