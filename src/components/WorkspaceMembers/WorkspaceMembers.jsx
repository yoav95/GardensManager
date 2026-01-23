import { useState } from "react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./WorkspaceMembers.module.css";

function WorkspaceMembers() {
  const { selectedWorkspace, workspaces, isSuperAdmin } = useWorkspace();
  const { user } = useAuth();
  const [showMembers, setShowMembers] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserUid, setNewUserUid] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.owner === user?.email;
  const isAdmin = currentWorkspace?.members?.[user?.uid]?.role === "admin";
  const canManage = isSuperAdmin || isOwner || isAdmin; // Super admin can manage any workspace

  if (!currentWorkspace) return null;

  const members = currentWorkspace.members || {};
  const membersList = Object.entries(members).map(([uid, data]) => ({
    uid,
    ...data
  }));

  const handleCopyWorkspaceId = () => {
    navigator.clipboard.writeText(selectedWorkspace);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleChangeRole = async (memberId, newRole) => {
    if (!canManage) return;

    try {
      await updateDoc(doc(db, "workspaces", selectedWorkspace), {
        [`members.${memberId}.role`]: newRole
      });
      alert("התפקיד עודכן בהצלחה!");
    } catch (error) {
      console.error("Error updating role:", error);
      alert("שגיאה בעדכון התפקיד");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!canManage) return;
    if (memberId === user.uid && !isSuperAdmin) {
      alert("לא ניתן להסיר את עצמך");
      return;
    }

    if (!confirm("האם אתה בטוח שברצונך להסיר משתמש זה?")) return;

    try {
      await updateDoc(doc(db, "workspaces", selectedWorkspace), {
        [`members.${memberId}`]: deleteField()
      });
      alert("המשתמש הוסר בהצלחה!");
    } catch (error) {
      console.error("Error removing member:", error);
      alert("שגיאה בהסרת המשתמש");
    }
  };

  const handleAddUserByUID = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    if (!newUserUid.trim()) {
      alert("אנא הזן Firebase UID");
      return;
    }

    setAddingUser(true);
    try {
      // Add user to workspace
      await updateDoc(doc(db, "workspaces", selectedWorkspace), {
        [`members.${newUserUid}`]: {
          role: "member",
          email: newUserEmail || "Unknown",
          displayName: newUserName || "User",
          joinedAt: new Date().toISOString()
        }
      });

      alert("המשתמש התווסף בהצלחה!");
      setNewUserUid("");
      setNewUserEmail("");
      setNewUserName("");
      setShowAddUser(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("שגיאה בהוספת המשתמש: " + error.message);
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setShowMembers(!showMembers)}
        className={styles.toggleButton}
      >
        👥 משתמשים ({membersList.length})
      </button>

      {showMembers && (
        <div className={styles.membersPanel}>
          <div className={styles.header}>
            <h3>משתמשי סביבת העבודה</h3>
            <p className={styles.workspaceName}>
              {currentWorkspace.name}
              {isSuperAdmin && <span className={styles.superAdminBadge}> (Super Admin)</span>}
            </p>
          </div>

          <div className={styles.shareSection}>
            <p className={styles.shareLabel}>שתף מזהה סביבה זו:</p>
            <div className={styles.idBox}>
              <code className={styles.workspaceId}>{selectedWorkspace}</code>
              <button 
                onClick={handleCopyWorkspaceId}
                className={styles.copyButton}
              >
                {copiedId ? "✓ הועתק" : "📋 העתק"}
              </button>
            </div>
            <p className={styles.shareHint}>
              שלח מזהה זה לאנשים שתרצה שיצטרפו לסביבת העבודה
            </p>
          </div>

          {canManage && (
            <div className={styles.addUserSection}>
              {!showAddUser ? (
                <button 
                  onClick={() => setShowAddUser(true)}
                  className={styles.addUserButton}
                >
                  ➕ הוסף משתמש ב-UID
                </button>
              ) : (
                <form onSubmit={handleAddUserByUID} className={styles.addUserForm}>
                  <h4>הוסף משתמש חדש</h4>
                  <div className={styles.formField}>
                    <label>Firebase UID *</label>
                    <input
                      type="text"
                      value={newUserUid}
                      onChange={(e) => setNewUserUid(e.target.value)}
                      placeholder="לדוגמה: abc123def456..."
                      required
                      disabled={addingUser}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>דוא"ל (אופציונלי)</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={addingUser}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>שם (אופציונלי)</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="שם המשתמש"
                      disabled={addingUser}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={addingUser}
                    >
                      {addingUser ? "מוסיף..." : "הוסף משתמש"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAddUser(false);
                        setNewUserUid("");
                        setNewUserEmail("");
                        setNewUserName("");
                      }}
                      className={styles.cancelButton}
                      disabled={addingUser}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className={styles.membersList}>
            {membersList.map((member) => (
              <div key={member.uid} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>
                    {member.displayName || member.email}
                    {member.uid === user.uid && (
                      <span className={styles.youBadge}>(אתה)</span>
                    )}
                  </p>
                  <p className={styles.memberEmail}>{member.email}</p>
                  <p className={styles.memberDate}>
                    הצטרף: {new Date(member.joinedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>

                <div className={styles.memberActions}>
                  {canManage && (member.uid !== user.uid || isSuperAdmin) ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.uid, e.target.value)}
                        className={styles.roleSelect}
                      >
                        <option value="member">חבר</option>
                        <option value="admin">מנהל</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.uid)}
                        className={styles.removeButton}
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <span className={styles.roleBadge}>{
                      member.role === 'admin' ? 'מנהל' : 'חבר'
                    }</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceMembers;
