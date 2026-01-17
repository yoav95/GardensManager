import { useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { ALLOWED_EMAILS } from "../../config/allowedEmails.js";
import styles from "./Login.module.css";

export default function Login({ user }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      // Check if email is allowed
      if (!ALLOWED_EMAILS.includes(userEmail)) {
        await signOut(auth);
        setError(`הגישה נדחתה. הדוא"ל ${userEmail} אינו מורשה.`);
        setLoading(false);
        return;
      }
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
        <h2>התחברות</h2>

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={styles.googleButton}
        >
          {loading ? "טוען..." : "🔐 התחבר עם Google"}
        </button>
      </div>
    </div>
  );
}
