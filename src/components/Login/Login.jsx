import { useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
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
      // No email whitelist check - access is controlled by workspace membership
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
          <h2>🌿 גן שלי</h2>
          <p>כניסה בהצלחה!</p>
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
        <h1>🌿 גן שלי</h1>
        
        {mode === "signin" ? (
          <>
            <h2>התחברות</h2>
            {error && <div className={styles.error}>{error}</div>}
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
              בחר בחשבון Google שלך ואנו נשלח בקשת אישור למנהל
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
