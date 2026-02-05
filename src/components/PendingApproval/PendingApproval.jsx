import { useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getAuth, signOut } from "firebase/auth";
import styles from "./PendingApproval.module.css";

function PendingApproval({ onApproved }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen to all workspaces in real-time
    const q = query(collection(db, "workspaces"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check if user is now a member of any workspace
      snapshot.forEach((doc) => {
        const members = doc.data().members || {};
        if (members[user.uid]) {
          // User has been approved!
          onApproved?.();
        }
      });
    });

    return unsubscribe;
  }, [user, onApproved]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/appcon.svg" alt="Garden Manager" className={styles.appIcon} />
        <h1>בהמתנה לאישור</h1>
        <p className={styles.message}>
          בקשת ההרשמה שלך התקבלה בהצלחה! 🎉
        </p>
        <p className={styles.submessage}>
          המנהל של המערכת יבדוק את בקשתך בקרוב. 
          <br />
          נעדכן אותך מיד לאחר האישור.
        </p>
        
        <div className={styles.details}>
          <p>
            <strong>📧 דוא"ל:</strong> 
            <span>{user?.email}</span>
          </p>
          <p>
            <strong>👤 שם:</strong> 
            <span>{user?.displayName || "משתמש"}</span>
          </p>
        </div>

        <div className={styles.status}>
          <div className={styles.spinner}></div>
          <p>🔄 בודק אישור...</p>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          התנתק
        </button>
      </div>
    </div>
  );
}

export default PendingApproval;
