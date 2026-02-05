import { useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import styles from "./Login.module.css";

export default function Login({ user }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" or "register"

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if this is a first-time sign-in (not in any workspace and not in pendingUsers)
      const userUID = result.user.uid;
      const userEmail = result.user.email;
      
      // Check if user exists in any workspace
      const workspacesQuery = query(collection(db, "workspaces"));
      const workspacesSnapshot = await getDocs(workspacesQuery);
      
      let userExistsInWorkspace = false;
      workspacesSnapshot.forEach(doc => {
        const members = doc.data().members || {};
        if (members[userUID]) {
          userExistsInWorkspace = true;
        }
      });
      
      // Check if already in pendingUsers
      const pendingQuery = query(
        collection(db, "pendingUsers"),
        where("uid", "==", userUID)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const alreadyPending = pendingSnapshot.size > 0;
      
      // If first-time user (not in workspace and not pending), add to newUsers
      if (!userExistsInWorkspace && !alreadyPending) {
        await addDoc(collection(db, "newUsers"), {
          email: userEmail,
          uid: userUID,
          displayName: result.user.displayName,
          signedInAt: Timestamp.now(),
          provider: "google",
          processed: false
        });
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      const userUID = result.user.uid;
      const userName = result.user.displayName;

      // Add to pending users collection
      await addDoc(collection(db, "pendingUsers"), {
        email: userEmail,
        uid: userUID,
        displayName: userName,
        registeredAt: Timestamp.now(),
        approved: false,
      });

      // Keep user signed in - they will see pending approval page
      setError("");
      setMode("signin");
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  }

  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <img src="/appcon.svg" alt="Garden Manager" className={styles.icon} />
          <p className={styles.message}>כניסה בהצלחה!</p>
          <p className={styles.email}>{user.displayName || user.email}</p>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            התנתק
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/appcon.svg" alt="Garden Manager" className={styles.icon} />
        
        {mode === "signin" ? (
          <>
            <h2>התחברות</h2>
            {error && <div className={styles.error}>{error}</div>}
            <p className={styles.subtitle}>
              כנס לחשבונך עם Google כדי להתחיל
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={styles.googleButton}
            >
              {loading ? "טוען..." : "🔐 התחבר עם Google"}
            </button>
            <p className={styles.toggleMode}>
              משתמש חדש? 
              <button 
                onClick={() => setMode("register")}
                className={styles.linkButton}
              >
                הירשם כאן
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>הרשמה</h2>
            {error && <div className={styles.error}>{error}</div>}
            <p className={styles.subtitle}>
              בחר בחשבון Google שלך ובקש אישור מהמנהל
            </p>
            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className={styles.googleButton}
            >
              {loading ? "טוען..." : "📝 הירשם עם Google"}
            </button>
            <p className={styles.toggleMode}>
              יש לך חשבון?
              <button 
                onClick={() => setMode("signin")}
                className={styles.linkButton}
              >
                התחבר
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
