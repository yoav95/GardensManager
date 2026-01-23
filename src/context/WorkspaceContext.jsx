import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useAuth } from "../hooks/useAuth.js";
import { SUPER_ADMIN_EMAILS } from "../config/allowedEmails.js";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    // Check if user is super admin
    const isSuper = SUPER_ADMIN_EMAILS.includes(user.email);
    setIsSuperAdmin(isSuper);

    // Query all workspaces
    const q = query(collection(db, "workspaces"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const wsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          // Super admins see ALL workspaces, regular users only see their memberships
          .filter(ws => {
            if (isSuper) return true; // Super admin sees everything
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
        loading,
        isSuperAdmin
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
