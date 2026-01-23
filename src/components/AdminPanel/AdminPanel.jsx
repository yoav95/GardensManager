import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./AdminPanel.module.css";

function AdminPanel() {
  const { selectedWorkspace, workspaces, isSuperAdmin } = useWorkspace();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "requests"

  // Get current workspace
  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.owner === user?.email;
  const isAdmin = currentWorkspace?.members?.[user?.uid]?.role === "admin";
  const canManage = isSuperAdmin || isOwner || isAdmin; // Super admin can manage any workspace

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    // Listen to pending users (for initial registration)
    const qUsers = query(
      collection(db, "pendingUsers"),
      where("approved", "==", false)
    );

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(users);
      setLoading(false);
    });

    // Listen to workspace join requests (for existing users joining this workspace)
    const qRequests = query(
      collection(db, "workspaceJoinRequests"),
      where("workspaceId", "==", selectedWorkspace),
      where("status", "==", "pending")
    );

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJoinRequests(requests);
    });

    return () => {
      unsubUsers();
      unsubRequests();
    };
  }, [canManage, selectedWorkspace]);

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

  const handleApproveJoinRequest = async (request) => {
    try {
      // Add user to workspace members
      await updateDoc(doc(db, "workspaces", selectedWorkspace), {
        [`members.${request.userId}`]: {
          role: "member",
          email: request.userEmail,
          displayName: request.displayName,
          joinedAt: new Date().toISOString()
        }
      });

      // Mark request as approved
      await updateDoc(doc(db, "workspaceJoinRequests", request.id), {
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: user.uid
      });

      alert(`${request.displayName} הצטרף לסביבת העבודה!`);
    } catch (error) {
      console.error("Error approving join request:", error);
      alert("שגיאה באישור הבקשה");
    }
  };

  const handleRejectJoinRequest = async (request) => {
    try {
      await updateDoc(doc(db, "workspaceJoinRequests", request.id), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectedBy: user.uid
      });
      alert(`בקשת ההצטרפות של ${request.displayName} נדחתה`);
    } catch (error) {
      console.error("Error rejecting join request:", error);
      alert("שגיאה בדחיית הבקשה");
    }
  };

  if (!canManage) {
    return null;
  }

  const totalPending = pendingUsers.length + joinRequests.length;

  return (
    <div className={styles.adminPanel}>
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className={styles.toggleButton}
      >
        {showPanel ? "🔒 סגור" : "👥 ניהול משתמשים"} 
        {totalPending > 0 && (
          <span className={styles.badge}>{totalPending}</span>
        )}
      </button>

      {showPanel && (
        <div className={styles.panelContent}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "users" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("users")}
            >
              הרשמות חדשות
              {pendingUsers.length > 0 && (
                <span className={styles.tabBadge}>{pendingUsers.length}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${activeTab === "requests" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              בקשות הצטרפות
              {joinRequests.length > 0 && (
                <span className={styles.tabBadge}>{joinRequests.length}</span>
              )}
            </button>
          </div>

          {activeTab === "users" && (
            <>
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
            </>
          )}

          {activeTab === "requests" && (
            <>
              <h3>בקשות הצטרפות לסביבת עבודה זו</h3>
              {joinRequests.length === 0 ? (
                <p className={styles.noUsers}>אין בקשות ממתינות</p>
              ) : (
                <div className={styles.usersList}>
                  {joinRequests.map(request => (
                    <div key={request.id} className={styles.userItem}>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{request.displayName}</p>
                        <p className={styles.userEmail}>{request.userEmail}</p>
                        <p className={styles.requestDate}>
                          {new Date(request.requestedAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className={styles.userActions}>
                        <button
                          onClick={() => handleApproveJoinRequest(request)}
                          className={styles.approveBtn}
                        >
                          ✓ אשר
                        </button>
                        <button
                          onClick={() => handleRejectJoinRequest(request)}
                          className={styles.rejectBtn}
                        >
                          ✕ דחה
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
