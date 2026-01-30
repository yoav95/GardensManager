import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";

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

async function checkWorkspaces() {
  try {
    const workspacesRef = collection(db, "workspaces");
    const q = query(workspacesRef);
    const snapshot = await getDocs(q);
    
    console.log("Existing workspaces:");
    snapshot.forEach(doc => {
      console.log(`  - ${doc.id}: ${doc.data().name}`);
    });
    
    if (snapshot.empty) {
      console.log("No workspaces found!");
    }
  } catch (error) {
    console.error("Error fetching workspaces:", error);
  }
}

checkWorkspaces().then(() => {
  process.exit(0);
});
