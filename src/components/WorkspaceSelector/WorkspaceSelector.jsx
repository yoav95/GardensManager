import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import CreateWorkspace from "../CreateWorkspace/CreateWorkspace.jsx";
import JoinWorkspace from "../JoinWorkspace/JoinWorkspace.jsx";
import styles from "./WorkspaceSelector.module.css";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner.jsx";

function WorkspaceSelector() {
  const { workspaces, selectedWorkspace, setSelectedWorkspace, loading, isSuperAdmin } = useWorkspace();

  if (loading) {
    return <LoadingSpinner message="טוען workspaces..." />;
  }

  return (
    <div className={styles.container}>
      {isSuperAdmin && (
        <div className={styles.superAdminNotice}>
          ⚡ Super Admin Mode - רואה את כל סביבות העבודה
        </div>
      )}

      {workspaces && workspaces.length > 0 && (
        <div className={styles.selector}>
          <label htmlFor="workspace-select" className={styles.label}>
            Workspace:
          </label>
          <select
            id="workspace-select"
            value={selectedWorkspace || ""}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className={styles.select}
          >
            {workspaces.map(workspace => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(!workspaces || workspaces.length === 0) && (
        <div className={styles.noWorkspaces}>
          <p>אין לך סביבות עבודה עדיין</p>
          <p className={styles.hint}>צור סביבת עבודה חדשה או הצטרף לקיימת</p>
        </div>
      )}

      <div className={styles.actions}>
        <CreateWorkspace onWorkspaceCreated={(id) => setSelectedWorkspace(id)} />
        <JoinWorkspace />
      </div>
    </div>
  );
}

export default WorkspaceSelector;
