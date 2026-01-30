import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";

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

async function updateGardenWorkspaceIds() {
  try {
    const oldWorkspaceId = "שלוליות";
    const newWorkspaceId = "peHoZ1yikp1oXlBkYxFJ";

    // Query all gardens with the old workspace ID
    const gardensRef = collection(db, "gardens");
    const q = query(gardensRef, where("workspaceId", "==", oldWorkspaceId));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} gardens with workspace ID "${oldWorkspaceId}"`);

    if (snapshot.size === 0) {
      console.log("No gardens to update!");
      process.exit(0);
    }

    // Update all gardens with the new workspace ID
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnapshot) => {
      const docRef = doc(gardensRef, docSnapshot.id);
      batch.update(docRef, { workspaceId: newWorkspaceId });
      count++;

      if (count % 10 === 0) {
        console.log(`Prepared ${count} gardens for update...`);
      }
    });

    console.log(`\nUpdating ${count} gardens...`);
    await batch.commit();
    console.log(`✅ Successfully updated ${count} gardens to workspace ID "${newWorkspaceId}"`);
  } catch (error) {
    console.error("Error updating gardens:", error);
    process.exit(1);
  }
}

updateGardenWorkspaceIds().then(() => {
  console.log("🌱 Update completed!");
  process.exit(0);
});
