import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./AdminPanel.module.css";

function AdminPanel() {
  const { selectedWorkspace, workspaces } = useWorkspace();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  // Get current workspace
  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.owner === user?.email;

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "pendingUsers"),
      where("approved", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(users);
      setLoading(false);
    });

    return unsubscribe;
  }, [isOwner]);

  const handleApproveUser = async (pendingUser) => {
    try {
      // Add user to workspace members
      await updateDoc(doc(db, "workspaces", selectedWorkspace), {
        [`members.${pendingUser.uid}`]: {
          role: "member",
          joinedAt: new Date().toISOString()
        }
      });

      // Mark as approved
      await updateDoc(doc(db, "pendingUsers", pendingUser.id), {
        approved: true
      });

      alert(`משתמש ${pendingUser.displayName} אושר בהצלחה!`);
    } catch (error) {
      console.error("Error approving user:", error);
      alert("שגיאה בהוספת המשתמש");
    }
  };

  const handleRejectUser = async (pendingUser) => {
    try {
      await deleteDoc(doc(db, "pendingUsers", pendingUser.id));
      alert(`בקשת הרשמה של ${pendingUser.displayName} נדחתה`);
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("שגיאה בדחיית המשתמש");
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className={styles.adminPanel}>
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className={styles.toggleButton}
      >
        {showPanel ? "🔒 סגור" : "👥 ניהול משתמשים"} 
        {pendingUsers.length > 0 && (
          <span className={styles.badge}>{pendingUsers.length}</span>
        )}
      </button>

      {showPanel && (
        <div className={styles.panelContent}>
          <h3>בקשות הרשמה לאישור</h3>
          
          {loading ? (
            <p>טוען...</p>
          ) : pendingUsers.length === 0 ? (
            <p className={styles.noUsers}>אין בקשות חדשות</p>
          ) : (
            <div className={styles.usersList}>
              {pendingUsers.map(pendingUser => (
                <div key={pendingUser.id} className={styles.userItem}>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{pendingUser.displayName}</p>
                    <p className={styles.userEmail}>{pendingUser.email}</p>
                  </div>
                  <div className={styles.userActions}>
                    <button
                      onClick={() => handleApproveUser(pendingUser)}
                      className={styles.approveBtn}
                    >
                      ✓ אשר
                    </button>
                    <button
                      onClick={() => handleRejectUser(pendingUser)}
                      className={styles.rejectBtn}
                    >
                      ✕ דחה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
