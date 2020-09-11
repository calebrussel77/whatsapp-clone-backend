const mongoose = require("mongoose");

let connectDB;
connectDB = mongoose
  .connect(
    "mongodb+srv://admin:Gwendoline16@cluster0.mocvv.mongodb.net/whatsapp_db?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    }
  )
  .then((result) => {
    console.log("MongoDB is Connected SUCCESSFUL !");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = connectDB;
