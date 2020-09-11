//require all the stuff
const express = require("express");
const Messages = require("./models/dbMessages");
const databaseConnect = require("./config/connectDb");
const dotenv = require("dotenv");
const cors = require("cors");
const pusher = require("./config/pusherConfig");
const mongoose = require("mongoose");

//app config
const app = express();
const port = process.env.PORT || 9000;
pusher;

//middlewares
app.use(express.json()); //never forgot to add this to have the response body parse in json
dotenv.config();
app.use(cors());

//DB config
databaseConnect;
const db = mongoose.connection;

//Create a changeStream in a collection and watch it for new change
db.once("open", () => {
  console.log("DB is Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//???

//api routes
app.get("/", (req, resp) => resp.status(200).send("hello world !"));

app.get("/api/messages/sync", (req, resp) => {
  Messages.find()
    .then((data) => {
      return resp.status(200).json(data);
    })
    .catch((err) => {
      return resp.status(500).json({
        err: "An error occured to the server",
      });
    });
});

app.post("/api/messages/new", (req, resp) => {
  const dbMessage = req.body;

  const message = new Messages(dbMessage);

  message
    .save()
    .then((data) => {
      return resp.status(201).json(data);
    })
    .catch((err) => {
      return resp.status(500).json({
        error: "an error occured",
      });
    });
});

//listen
app.listen(port, () => console.log(`listen on port ${port}`));
