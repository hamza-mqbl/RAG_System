const express = require("express");
const ErrorHandler = require("./middleware/error.js");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(express.json());
// config
require('dotenv').config();
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "http://localhost:8000", // Local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// app.use()
app.use("/", express.static("uploads")); //setup done for 2nd branch
// Increase the payload size limit
app.use(bodyParser.json({ limit: "50mb" })); // Increase limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));



// import routes
const transcriptRoutes = require("./routes/transcriptRoutes.js");

app.use("/api/transcript", transcriptRoutes);

app.get("/is", (req, res) => {
  res.send("Server is running!");
});

// it is not for errorhandling
app.use(ErrorHandler);

// create server

module.exports = app;
