import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  if (line && !line.startsWith("#")) {
    const [key, value] = line.split("=");
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/['"]/g, "");
    }
  }
});

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedGoldieData() {
  try {
    // Read the goldieData.json file
    const dataPath = path.join(__dirname, "../src/goldieData.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    console.log(`Found ${data.gardens.length} gardens to seed...`);

    // Get the batch to perform bulk writes
    const batch = writeBatch(db);
    const workspaceId = "שלוליות";
    const gardensRef = collection(db, "gardens");

    let count = 0;
    for (const garden of data.gardens) {
      try {
        // Add workspaceId to each garden if it doesn't exist
        const gardenData = {
          ...garden,
          workspaceId: workspaceId
        };
        
        // Create a reference for the new document with the specific ID
        const docRef = doc(gardensRef, garden.id);
        batch.set(docRef, gardenData);
        count++;

        if (count % 10 === 0) {
          console.log(`Prepared ${count} gardens...`);
        }
      } catch (error) {
        console.error(`Error preparing garden ${garden.name}:`, error);
      }
    }

    // Commit the batch
    console.log(`\nCommitting ${count} gardens to database...`);
    await batch.commit();
    console.log(`✅ Successfully added ${count} gardens to workspace "שלוליות"`);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedGoldieData().then(() => {
  console.log("🌱 Data seeding completed!");
  process.exit(0);
});
