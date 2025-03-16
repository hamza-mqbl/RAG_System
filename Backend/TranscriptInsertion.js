require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { pipeline } = require("@huggingface/transformers");
const YoutubeTranscript = require("youtube-transcript").YoutubeTranscript;

// Initialize Pinecone
const pc = new Pinecone({
  apiKey:
    "pcsk_9CBfH_8n7E7WVnqxRPQ94X5ivpAFFfHjPsCyRxJ8fmpVTr6g2kRirVTKgLTNZQqQbQB1x",
});
const indexName = "test-youtube";
const index = pc.index(indexName);

// Step 1: Fetch Transcript from YouTube
async function fetchTranscript(videoUrl) {
  const transcript = await YoutubeTranscript.fetchTranscript(videoUrl, {
    lang: "en",
  });
  return transcript;
}

// Step 2: Generate Embeddings using Sentence Transformers
async function getEmbeddings(texts) {
  const extractor = await pipeline(
    "feature-extraction",
    "sentence-transformers/all-MiniLM-L6-v2"
  );
  const embeddings = await extractor(texts, {
    pooling: "mean",
    normalize: true,
  });
  return embeddings.tolist(); // Convert tensor to plain array
}

// Step 4: Store Transcripts in Pinecone
// Step 3: Store Transcripts in Pinecone (No Chunking)
async function storeTranscripts(videoUrls) {
  for (const videoUrl of videoUrls) {
    const transcript = await fetchTranscript(videoUrl);

    if (transcript.length === 0) {
      console.log(`No transcript found for video: ${videoUrl}`);
      continue;
    }

    console.log(`Processing video: ${videoUrl}`);

    // Generate embeddings for each snippet of text
    const texts = transcript.map((snippet) => snippet.text);
    const snippetEmbeddings = await getEmbeddings(texts);

    // Create vectors with metadata
    const snippetVectors = snippetEmbeddings.map((embedding, i) => ({
      id: `${videoUrl}-${i}`, // Unique ID for each snippet
      values: embedding, // Embedding vector
      metadata: {
        text: transcript[i].text,
        timestamp: transcript[i].offset, // Offset of the snippet
        videoUrl: videoUrl, // Full YouTube video URL
      },
    }));

    // Batch and upsert vectors into Pinecone (max 1000 vectors per request)
    const batchSize = 1000;
    for (let i = 0; i < snippetVectors.length; i += batchSize) {
      const batch = snippetVectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`Upserted batch ${i / batchSize + 1} for video: ${videoUrl}`);
    }

    console.log(`Stored transcript for video: ${videoUrl}`);
  }
}
// Main Function to Run the System
async function main() {
  // List of YouTube video URLs to process
  const videoUrls = ["https://youtu.be/cfV70T6Owpw?si=6evBNa5Ogpz6Y55O"];

  // Step 1: Store transcripts in Pinecone
  console.log("Storing transcripts in Pinecone...");
  await storeTranscripts(videoUrls);
  console.log("Transcripts stored successfully!");
}
// Run the main function
main().catch(console.error);   
// add those links of youtube video whome transcript you want to insert int vector db and the run this file using node TranscriptInsertion.js

