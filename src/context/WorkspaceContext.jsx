import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../hooks/useAuth.js";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setLoading(false);
      return;
    }

    // Query all workspaces and filter client-side for membership
    const q = query(collection(db, "workspaces"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const wsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Filter for workspaces where user is a member
          .filter(ws => {
            const members = ws.members || {};
            return members[user.uid] !== undefined;
          });

        setWorkspaces(wsList);

        // Auto-select first workspace or restore from localStorage
        const savedWorkspaceId = localStorage.getItem("selectedWorkspace");
        if (savedWorkspaceId && wsList.find(w => w.id === savedWorkspaceId)) {
          setSelectedWorkspace(savedWorkspaceId);
        } else if (wsList.length > 0) {
          setSelectedWorkspace(wsList[0].id);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleWorkspaceChange = (workspaceId) => {
    setSelectedWorkspace(workspaceId);
    localStorage.setItem("selectedWorkspace", workspaceId);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        setSelectedWorkspace: handleWorkspaceChange,
        loading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
