const express = require("express");
const {
  
    analyzeTranscript,
} = require("../controllers/transcriptController.js");

const router = express.Router();

router.post("/analyze", analyzeTranscript);

module.exports = router;
