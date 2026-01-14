import { useState } from "react";
import styles from "./App.module.css";

import GardenView from "./components/GardenView/GardenView";
import TasksView from "./components/TaskView/TasksView";
import AreasMap from "./components/AreaMap/AreasMap";
import TopButton from "./components/TopButton/TopButton.jsx";
import  useTopBarCounts  from "./hooks/useTopBarCounts.js";
import ShoppingListView from "./components/ShoppingListView/ShoppingListView.jsx";

function App() {
  const { gardenCount, totalBadgeCount, shoppingCount } = useTopBarCounts();

  const [view, setView] = useState("gardens");

  return (
    <div className={styles.appContainer}>
      <div className={styles.topBox}>
        <TopButton
  label="גינות"
  active={view === "gardens"}
  onClick={() => setView("gardens")}
  badge={gardenCount}
  badgeVariant="info"
/>

        <TopButton
          label="מפה"
          active={view === "map"}
          onClick={() => setView("map")}
        />

        <TopButton
  label="משימות"
  active={view === "tasks"}
  onClick={() => setView("tasks")}
  badge={totalBadgeCount}
/>
<TopButton
          label="חוסרים"
          active={view === "shopping"}
          onClick={() => setView("shopping")}
          badge={shoppingCount}
          badgeVariant="info" // green badge for shopping list
        />
      </div>
      

      {view === "gardens" && <GardenView />}
      {view === "tasks" && <TasksView />}
      {view === "map" && <AreasMap />}
      {view === "shopping" && <ShoppingListView />} 
    </div>
  );
}

export default App;