const express = require("express");
const ErrorHandler = require("./middleware/error.js");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const transcriptRoutes = require('./routes/transcriptRoutes.js');
app.use(express.json());
// app.use(cookieParser());


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

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "backend/config/.env",
  });
}

// import routes


app.use('/api/transcript', transcriptRoutes);

app.get("/is", (req, res) => {
  res.send("Server is running!");
});

// it is not for errorhandling
app.use(ErrorHandler);
// create server
const server = app.listen(5000, () => {
  console.log(`Server is running on http://localhost:5000`);
});
module.exports = app;
