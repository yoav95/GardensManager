import { useState } from "react";
import styles from "./App.module.css";

import GardenView from "./components/GardenView/GardenView";
import TasksView from "./components/TaskView/TasksView";
import AreasMap from "./components/AreaMap/AreasMap";
import Navigation from "./components/Navigation/Navigation.jsx";
import useTopBarCounts from "./hooks/useTopBarCounts.js";
import ShoppingListView from "./components/ShoppingListView/ShoppingListView.jsx";
import Login from "./components/Login/Login.jsx";
import { useAuth } from "./hooks/useAuth.js";

function App() {
  const { user, loading } = useAuth();
  const { gardenCount, totalBadgeCount, shoppingCount } = useTopBarCounts();

  const [view, setView] = useState("gardens");

  if (loading) {
    return (
      <div className={styles.appContainer}>
        <p style={{ textAlign: "center", marginTop: "50px" }}>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return <Login user={user} />;
  }

  return (
    <div className={styles.appContainer}>
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

export default App;