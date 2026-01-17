import { useState } from "react";
import styles from "./App.module.css";

import GardenView from "./components/GardenView/GardenView";
import TasksView from "./components/TaskView/TasksView";
import AreasMap from "./components/AreaMap/AreasMap";
import Navigation from "./components/Navigation/Navigation.jsx";
import  useTopBarCounts  from "./hooks/useTopBarCounts.js";
import ShoppingListView from "./components/ShoppingListView/ShoppingListView.jsx";

function App() {
  const { gardenCount, totalBadgeCount, shoppingCount } = useTopBarCounts();

  const [view, setView] = useState("gardens");

  return (
    <div className={styles.appContainer}>
      <Navigation
        view={view}
        setView={setView}
        gardenCount={gardenCount}
        totalBadgeCount={totalBadgeCount}
        shoppingCount={shoppingCount}
      />
      
      {view === "gardens" && <GardenView />}
      {view === "tasks" && <TasksView />}
      {view === "map" && <AreasMap />}
      {view === "shopping" && <ShoppingListView />} 
    </div>
  );
}

export default App;