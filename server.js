//require all the stuff
const express = require("express");
const Messages = require("./models/dbMessages");
const Rooms = require("./models/rooms");
const LastMessages = require("./models/lastMessages");
const databaseConnect = require("./config/connectDb");
const dotenv = require("dotenv");
const cors = require("cors");
const pusher = require("./config/pusherConfig");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("./models/users");

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

  const msgCollection = db.collection("messagecontents"); //the name in the DB
  const roomCollection = db.collection("rooms");
  const lastMsgCollection = db.collection("lastmessages");

  const changeStreamRoom = roomCollection.watch();
  const changeStreamLastMsg = lastMsgCollection.watch();
  const changeStreamMsg = msgCollection.watch();

  changeStreamLastMsg.on("change", (change) => {
    if (change.operationType === "insert") {
      const lastMsgDetails = change.fullDocument;
      pusher.trigger("lastMsg", "inserted", {
        _id: lastMsgDetails._id,
        roomName: lastMsgDetails.roomName,
        message: lastMsgDetails.message,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });

  changeStreamRoom.on("change", (change) => {
    if (change.operationType === "insert") {
      const rommDetails = change.fullDocument;
      pusher.trigger("rooms", "inserted", {
        _id: rommDetails._id,
        name: rommDetails.name,
        image: rommDetails.image,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });

  changeStreamMsg.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        _id: messageDetails._id,
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

//Get all The Messages of the Given Room
app.get("/api/rooms/messages/:id", (req, resp) => {
  const id = req.params.id;
  Rooms.findOne({ _id: id })
    .populate("messageId")
    .exec(function (err, data) {
      if (err) return console.log(err);
      resp.status(200).json(data);
      // prints "The author is Ian Fleming"
    });
});

//Google Authentication
const client = new OAuth2Client(process.env.GOOGLE_CLIENT);
app.post("/api/login/google", (req, resp) => {
  const { idToken } = req.body;

  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT })
    .then((response) => {
      const { email_verified, name, email, picture } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            });
            return resp.json({
              token,
              user: user,
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({
              name,
              email,
              password,
              imageUrl: picture,
            });
            user.save((err, data) => {
              if (err) {
                console.log("ERROR GOOGLE LOGIN ON USER SAVE", err);
                return resp.status(400).json({
                  error: "User signup failed with google",
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
              );
              return resp.status(200).json({
                token,
                user: data,
              });
            });
          }
        });
      } else {
        return resp.status(400).json({
          error: "Google login failed. Try again",
        });
      }
    });
});

app.get("/api/rooms/sync", (req, resp) => {
  Rooms.find()
    .populate("messageId")
    .exec(function (err, data) {
      if (err) return console.log(err);
      resp.status(200).json(data);
    });
});

app.post("/api/rooms/new", (req, resp) => {
  const newRoom = req.body;

  const room = new Rooms(newRoom);

  room
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

app.get("/api/rooms/last-message/:id", (req, resp) => {
  const id = req.params.id;
  Rooms.findOne({ _id: id })
    .populate("messageId")
    .exec(function (err, data) {
      if (err) return console.log(err);
      resp.status(200).json(data.messageId[data.messageId.length - 1]);
    });
});

app.post("/api/messages/new/:id", (req, resp) => {
  const dbMessage = req.body;
  const id = req.params.id;

  const message = new Messages(dbMessage);

  message
    .save()
    .then((data) => {
      Rooms.findOne({ _id: id })
        .then((room) => {
          room.messageId.push(data);
          room.save();
          const lastMessage = new LastMessages({
            roomName: room.name,
            message: dbMessage.message,
          });
          lastMessage.save().then(() => {
            return resp.status(201).json(data);
          });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => {
      return resp.status(500).json({
        error: "an error occured",
      });
    });
});

//listen
app.listen(port, () => console.log(`listen on port ${port}`));
