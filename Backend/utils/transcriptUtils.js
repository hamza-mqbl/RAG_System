const { pipeline } = require("@huggingface/transformers");
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize Pinecone
const pc = new Pinecone({
  apiKey:process.env.PINECONE_API_KEY,
});
const indexName = "test-youtube";
const index = pc.index(indexName);

// Step 1: Generate Embeddings using Sentence Transformers
async function getEmbeddings(texts) {
  try {
    const extractor = await pipeline(
      "feature-extraction",
      "sentence-transformers/all-MiniLM-L6-v2"
    );
    const embeddings = await extractor(texts, {
      pooling: "mean",
      normalize: true,
    });
    return embeddings.tolist(); // Convert tensor to plain array
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    throw new Error("Failed to generate embeddings.");
  }
}

// Step 2: Query Pinecone for Relevant Transcripts
async function queryTranscripts(query) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await getEmbeddings([query]);

    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryEmbedding[0],
      topK: 1, 
      includeMetadata: true,
    });

    // Log the query response for debugging
    console.log("Query Response:", JSON.stringify(queryResponse, null, 2));

    // Extract relevant chunks with metadata
    return queryResponse.matches.map((match) => ({
      text: match.metadata.text,
      timestamp: match.metadata.timestamp,
      videoUrl: match.metadata.videoUrl,
    }));
  } catch (error) {
    console.error("Pinecone query failed:", error);
    throw new Error("Failed to query Pinecone.");
  }
}

// Step 3: Generate YouTube Timestamped Link
function generateYouTubeLink(videoUrl, timestamp) {
  if (!videoUrl) {
    throw new Error("Video URL is undefined or null.");
  }

  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);

  // Generate the timestamped link
  return `${videoUrl}&t=${minutes}m${seconds}s`;
}

module.exports = { getEmbeddings, queryTranscripts, generateYouTubeLink };
