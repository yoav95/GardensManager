import { getAuth, signOut } from "firebase/auth";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import AdminPanel from "../AdminPanel/AdminPanel.jsx";
import WorkspaceMembers from "../WorkspaceMembers/WorkspaceMembers.jsx";
import styles from "./TopNavbar.module.css";

function TopNavbar() {
  const { workspaces, selectedWorkspace, isSuperAdmin } = useWorkspace();
  const auth = getAuth();

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <div className={styles.topNavbar}>
      <div className={styles.workspaceName}>
        🌿 {currentWorkspace?.name || "טוען..."}
      </div>
      
      <div className={styles.actions}>
        {isSuperAdmin && <WorkspaceMembers />}
        {isSuperAdmin && <AdminPanel />}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          התנתק
        </button>
      </div>
    </div>
  );
}

export default TopNavbar;
