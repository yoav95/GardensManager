import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import styles from "./WorkspaceSelector.module.css";

function WorkspaceSelector() {
  const { workspaces, selectedWorkspace, setSelectedWorkspace, loading } = useWorkspace();

  if (loading) {
    return <div className={styles.selector}>טוען workspaces...</div>;
  }

  if (!workspaces || workspaces.length === 0) {
    return <div className={styles.selector}>אין workspaces זמינים</div>;
  }

  return (
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
  );
}

export default WorkspaceSelector;
