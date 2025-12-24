import { useGardens } from "./hooks/useGardens";
import styles from "./App.module.css";

import { useState } from "react";
import GardenView from "./GardenView";
import TasksView from "./TasksView";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};
const tasksCount = 5;

function App() {
  const gardens = useGardens();
  const [view, setView] = useState("gardens");
  const [selectedDay, setSelectedDay] = useState("");

  const visibleGardens = selectedDay
    ? gardens.filter((g) => g.day === selectedDay)
    : gardens;

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.topBox}>
  <button
    className={`${styles.gardenViewButton} ${view === "gardens" ? styles.active : ""}`}
    onClick={() => setView("gardens")}
  >
    גינות
  </button>

  <button
  className={`${styles.tasksViewButtom} ${
    view === "tasks" ? styles.active : ""
  }`}
  onClick={() => setView("tasks")}
>
  משימות

  {tasksCount > 0 && (
    <span className={styles.taskBadge}>
      {tasksCount}
    </span>
  )}
</button>
</div>

      {view === "gardens" ? <GardenView /> : <TasksView />}
    </div>
  );
}

export default App;
