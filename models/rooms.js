const mongoose = require("mongoose");

const roomsSchema = new mongoose.Schema({
  name: String,
  image: {
    default:
      "https://www.promarinetrade.com/cache/promarine/public/shop_product_picture/_1200x800x0/4629_R.jpg",
    type: String,
  },
  messageId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageContent",
    },
  ],
});

module.exports = mongoose.model("Room", roomsSchema);
