import { useGardens } from "./hooks/useGardens";
import styles from "./App.module.css";
import { collection, onSnapshot } from "firebase/firestore";import { db } from "./firebase/config";
import { getCoordinates } from "./utils/getCoordinates.js";
import { useState,useEffect } from "react";
import GardenView from "./components/GardenView/GardenView.jsx";
import TasksView from "./components/TaskView/TasksView.jsx";
import { findArea } from "./utils/findArea.js";
import AreasMap from "./components/AreaMap/AreasMap.jsx";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

function App() {
  const gardens = useGardens();
  const [view, setView] = useState("gardens");
  const [selectedDay, setSelectedDay] = useState("");
    const [totalCount, setTotalCount] = useState(0);


  // const visibleGardens = selectedDay
  //   ? gardens.filter((g) => g.day === selectedDay)
  //   : gardens;


  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
   useEffect(() => {
  let unfinishedTasks = 0;
  let unresolvedIssues = 0;

  const unsubTasks = onSnapshot(collection(db, "tasks"), snapshot => {
    unfinishedTasks = snapshot.docs.filter(d => !d.data().done).length;
    setTotalCount(unfinishedTasks + unresolvedIssues);
  });

  const unsubGardens = onSnapshot(collection(db, "gardens"), snapshot => {
    unresolvedIssues = snapshot.docs.reduce((sum, doc) => {
      const issues = doc.data().requiresAttention || [];
      return sum + issues.filter(issue => !issue.resolved).length;
    }, 0);
    setTotalCount(unfinishedTasks + unresolvedIssues);
  });

  return () => {
    unsubTasks();
    unsubGardens();
  };
}, []);

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
    className={`${styles.mapViewButton} ${view === "map" ? styles.active : ""}`}
    onClick={() => setView("map")}
  >
    מפה
  </button>
   <button
          className={`${styles.tasksViewButtom} ${view === "tasks" ? styles.active : ""}`}
          onClick={() => setView("tasks")}
        >
          משימות
          {totalCount > 0 && (
  <span className={`${styles.taskBadge}`}>
    {totalCount}
  </span>
)}
        </button>
        
</div>

      {view === "gardens" && <GardenView />}
      {view === "tasks" && <TasksView />}
      {view === "map" && <AreasMap />}
      {/* <AreasMap /> */}
    </div>
  );
}

export default App;
