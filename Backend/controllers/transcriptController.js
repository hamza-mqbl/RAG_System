const { pipeline } = require("@huggingface/transformers");
const { Pinecone } = require("@pinecone-database/pinecone");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { queryTranscripts, generateYouTubeLink } = require("../utils/transcriptUtils");
const ErrorHandler = require("../utils/ErrorHandler");



// Step 4: Analyze Transcript
const analyzeTranscript = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.body;
  // console.log("🚀 ~ analyzeTranscript ~ query:", query);

  if (!query) {
    return next(new ErrorHandler("Query is required.", 400));
  }

  // Query the system
  const relevantChunks = await queryTranscripts(query);

  // Generate timestamped links for the relevant chunks
  const results = relevantChunks
    .map((chunk) => {
      try {
        // Generate the timestamped link
        const timestampedLink = generateYouTubeLink(
          chunk.videoUrl,
          chunk.timestamp
        );
        // console.log("🚀 ~ .map ~ timestampedLink:", timestampedLink);
        return {
          text: chunk.text,
          timestampedLink,
        };
      } catch (error) {
        console.warn(`Error generating link for chunk: ${error.message}`);
        return null;
      }
    })
    .filter((result) => result !== null); // Remove null entries

  res.json({ results });
});

module.exports = { analyzeTranscript };
