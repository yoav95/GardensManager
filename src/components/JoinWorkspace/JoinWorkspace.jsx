import { useState } from "react";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useEffect } from "react";
import styles from "./JoinWorkspace.module.css";

function JoinWorkspace() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);

  // Listen to user's pending join requests
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "workspaceJoinRequests"),
      where("userId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingRequests(requests);
    });

    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a join request
      await addDoc(collection(db, "workspaceJoinRequests"), {
        workspaceId: workspaceCode.trim(),
        userId: user.uid,
        userEmail: user.email,
        displayName: user.displayName || user.email,
        requestedAt: new Date().toISOString(),
        status: "pending"
      });

      alert("בקשת ההצטרפות נשלחה! מנהל הסביבה יאשר אותך בקרוב.");
      setWorkspaceCode("");
      setShowForm(false);
    } catch (error) {
      console.error("Error requesting to join workspace:", error);
      alert("שגיאה בשליחת בקשה: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={styles.joinButton}
        >
          🔗 הצטרף לסביבת עבודה
        </button>
      ) : (
        <div className={styles.formCard}>
          <h3>הצטרף לסביבת עבודה</h3>
          <p className={styles.description}>
            הזן את מזהה סביבת העבודה שקיבלת מהמנהל
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="workspaceCode">מזהה סביבת עבודה *</label>
              <input
                type="text"
                id="workspaceCode"
                value={workspaceCode}
                onChange={(e) => setWorkspaceCode(e.target.value)}
                required
                placeholder="לדוגמה: abc123def456"
                className={styles.input}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                disabled={loading || !workspaceCode.trim()}
                className={styles.submitButton}
              >
                {loading ? "שולח..." : "שלח בקשה"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setWorkspaceCode("");
                }}
                className={styles.cancelButton}
                disabled={loading}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className={styles.pendingSection}>
          <h4>בקשות ממתינות</h4>
          <ul className={styles.pendingList}>
            {pendingRequests.map(request => (
              <li key={request.id} className={styles.pendingItem}>
                <span>📋 {request.workspaceName || request.workspaceId}</span>
                <span className={styles.pendingBadge}>ממתין לאישור</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default JoinWorkspace;
