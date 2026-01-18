import { useState, useEffect } from "react";
import styles from "./App.module.css";

import GardenView from "./components/GardenView/GardenView";
import TasksView from "./components/TaskView/TasksView";
import AreasMap from "./components/AreaMap/AreasMap";
import Navigation from "./components/Navigation/Navigation.jsx";
import TopNavbar from "./components/TopNavbar/TopNavbar.jsx";
import useTopBarCounts from "./hooks/useTopBarCounts.js";
import ShoppingListView from "./components/ShoppingListView/ShoppingListView.jsx";
import Login from "./components/Login/Login.jsx";
import PendingApproval from "./components/PendingApproval/PendingApproval.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "./firebase/config.js";

function AppContent() {
  const { user } = useAuth();
  const { gardenCount, totalBadgeCount, shoppingCount } = useTopBarCounts();
  const [view, setView] = useState("gardens");

  return (
    <div className={styles.appContainer}>
      <TopNavbar />
      <Navigation
        view={view}
        setView={setView}
        gardenCount={gardenCount}
        totalBadgeCount={totalBadgeCount}
        shoppingCount={shoppingCount}
        user={user}
      />
      
      {view === "gardens" && <GardenView />}
      {view === "tasks" && <TasksView />}
      {view === "map" && <AreasMap />}
      {view === "shopping" && <ShoppingListView />} 
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [isPending, setIsPending] = useState(true); // Default to pending
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setIsPending(true);
      setCheckingStatus(false);
      return;
    }

    async function checkWorkspaceAccess() {
      setCheckingStatus(true);
      try {
        // Query all workspaces to see if user is a member of any
        const q = query(collection(db, "workspaces"));
        const snapshot = await getDocs(q);
        
        let isMemberOfAny = false;
        
        snapshot.forEach((doc) => {
          const members = doc.data().members || {};
          if (members[user.uid]) {
            isMemberOfAny = true;
          }
        });

        // If user is not a member of any workspace, they're pending
        setIsPending(!isMemberOfAny);
      } catch (error) {
        console.error("Error checking workspace access:", error);
        setIsPending(true); // Default to pending if error
      }
      setCheckingStatus(false);
    }

    checkWorkspaceAccess();
  }, [user]);

  if (loading || checkingStatus) {
    return (
      <div className={styles.appContainer}>
        <p style={{ textAlign: "center", marginTop: "50px" }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return <Login user={user} />;
  }

  if (isPending) {
    return <PendingApproval onApproved={() => setIsPending(false)} />;
  }

  return <AppContent />;
}

export default App;