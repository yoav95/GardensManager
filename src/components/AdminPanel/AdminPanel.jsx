import { useEffect, useState, useCallback } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./AdminPanel.module.css";

function AdminPanel() {
  const { selectedWorkspace, workspaces, isSuperAdmin } = useWorkspace();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // "users", "requests", "newusers", or "allusers"
  const [selectedWorkspaceForUser, setSelectedWorkspaceForUser] = useState(selectedWorkspace);
  const [searchTerm, setSearchTerm] = useState("");

  // Get current workspace
  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.owner === user?.email;
  const isAdmin = currentWorkspace?.members?.[user?.uid]?.role === "admin";
  const canManage = isSuperAdmin || isOwner || isAdmin; // Super admin can manage any workspace

  // Function to fetch all users from all workspaces
  const fetchAllUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      const workspacesSnapshot = await getDocs(collection(db, "workspaces"));
      const usersMap = new Map(); // Use map to deduplicate users by UID
      
      workspacesSnapshot.forEach(wsDoc => {
        const members = wsDoc.data().members || {};
        Object.entries(members).forEach(([uid, memberData]) => {
          if (!usersMap.has(uid)) {
            usersMap.set(uid, {
              uid,
              email: memberData.email || "",
              displayName: memberData.displayName || "Unknown",
              workspaces: [wsDoc.id],
              ...memberData
            });
          } else {
            // Add workspace to existing user's list
            usersMap.get(uid).workspaces.push(wsDoc.id);
          }
        });
      });
      
      setAllUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let isComponentMounted = true;

    // Only set up listeners if user can manage or is super admin
    if (!isSuperAdmin && !canManage) {
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
      if (isComponentMounted) {
        setPendingUsers(users);
        setLoading(false);
      }
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

    // Listen to new users (first-time Google sign-ins) - only for super admin
    let unsubNewUsers = () => {};
    if (isSuperAdmin) {
      const qNewUsers = query(
        collection(db, "newUsers"),
        where("processed", "==", false)
      );
      unsubNewUsers = onSnapshot(qNewUsers, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewUsers(users);
      });

      // Fetch all users
      fetchAllUsers();
    }

    return () => {
      isComponentMounted = false;
      unsubUsers();
      unsubRequests();
      unsubNewUsers();
    };
  }, [isSuperAdmin, selectedWorkspace, canManage, fetchAllUsers]);

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

  const handleAddNewUserToWorkspace = async (newUser) => {
    if (!selectedWorkspaceForUser) {
      alert("בחר סביבת עבודה");
      return;
    }

    try {
      // Add user to workspace members
      await updateDoc(doc(db, "workspaces", selectedWorkspaceForUser), {
        [`members.${newUser.uid}`]: {
          role: "member",
          email: newUser.email,
          displayName: newUser.displayName,
          joinedAt: new Date().toISOString(),
          addedBy: user.uid
        }
      });

      // Mark as processed
      await updateDoc(doc(db, "newUsers", newUser.id), {
        processed: true,
        processedAt: new Date().toISOString(),
        processedBy: user.uid,
        addedToWorkspace: selectedWorkspaceForUser
      });

      alert(`${newUser.displayName} נוסף לסביבת העבודה בהצלחה!`);
      setSelectedWorkspaceForUser(selectedWorkspace);
    } catch (error) {
      console.error("Error adding new user to workspace:", error);
      alert("שגיאה בהוספת המשתמש");
    }
  };

  const handleRejectNewUser = async (newUser) => {
    try {
      await updateDoc(doc(db, "newUsers", newUser.id), {
        processed: true,
        processedAt: new Date().toISOString(),
        processedBy: user.uid,
        rejected: true
      });
      alert(`המשתמש ${newUser.displayName} נדחה`);
    } catch (error) {
      console.error("Error rejecting new user:", error);
      alert("שגיאה בדחיית המשתמש");
    }
  };

  if (!isSuperAdmin && !canManage) {
    return null;
  }

  const totalPending = pendingUsers.length + joinRequests.length + (isSuperAdmin ? newUsers.length : 0);

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
            {isSuperAdmin && (
              <>
                <button
                  className={`${styles.tab} ${activeTab === "newusers" ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab("newusers")}
                >
                  משתמשים חדשים
                  {newUsers.length > 0 && (
                    <span className={styles.tabBadge}>{newUsers.length}</span>
                  )}
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "allusers" ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab("allusers")}
                >
                  כל המשתמשים ({allUsers.length})
                </button>
              </>
            )}
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

          {activeTab === "newusers" && isSuperAdmin && (
            <>
              <h3>משתמשים שנכנסו לראשונה (אין סביבת עבודה)</h3>
              <p className={styles.subtitle}>UID: בחר סביבת עבודה להוסיף את המשתמש</p>
              {newUsers.length === 0 ? (
                <p className={styles.noUsers}>אין משתמשים חדשים</p>
              ) : (
                <div className={styles.usersList}>
                  {newUsers.map(newUser => (
                    <div key={newUser.id} className={styles.userItem}>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{newUser.displayName}</p>
                        <p className={styles.userEmail}>{newUser.email}</p>
                        <p className={styles.userId}>UID: {newUser.uid}</p>
                        <p className={styles.requestDate}>
                          נכנס: {new Date(newUser.signedInAt.toDate()).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className={styles.userActions}>
                        <select
                          value={selectedWorkspaceForUser}
                          onChange={(e) => setSelectedWorkspaceForUser(e.target.value)}
                          className={styles.workspaceSelect}
                        >
                          <option value="">-- בחר סביבת עבודה --</option>
                          {workspaces.map(ws => (
                            <option key={ws.id} value={ws.id}>
                              {ws.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddNewUserToWorkspace(newUser)}
                          disabled={!selectedWorkspaceForUser}
                          className={styles.approveBtn}
                        >
                          ✓ הוסף
                        </button>
                        <button
                          onClick={() => handleRejectNewUser(newUser)}
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

          {activeTab === "allusers" && isSuperAdmin && (
            <>
              <h3>כל המשתמשים במערכת</h3>
              <input
                type="text"
                placeholder="חפש לפי שם או UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {allUsers.length === 0 ? (
                <p className={styles.noUsers}>אין משתמשים</p>
              ) : (
                <div className={styles.usersList}>
                  {allUsers
                    .filter(u => 
                      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.uid?.includes(searchTerm)
                    )
                    .map(u => (
                      <div key={u.uid} className={styles.userItem}>
                        <div className={styles.userInfo}>
                          <p className={styles.userName}>{u.displayName}</p>
                          <p className={styles.userEmail}>{u.email}</p>
                          <p className={styles.userId}>UID: {u.uid}</p>
                          <p className={styles.userWorkspaces}>
                            במרחבים: {u.workspaces?.length || 0}
                          </p>
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
