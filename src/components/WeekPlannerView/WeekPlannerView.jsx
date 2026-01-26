import { useState, useEffect } from "react";
import WeekPlanner from "./WeekPlanner";
import styles from "./WeekPlannerView.module.css";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../context/WorkspaceContext";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

function WeekPlannerView() {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the start of the current week (Sunday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to get Sunday
    return new Date(d.setDate(diff));
  };

  // Fetch saved weeks from Firestore
  useEffect(() => {
    if (!user || !selectedWorkspace) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "weeks"),
      where("userId", "==", user.uid),
      where("workspaceId", "==", selectedWorkspace)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedWeeks = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            weekStartDate: doc.data().weekStartDate.toDate(),
            weekEndDate: doc.data().weekEndDate.toDate(),
          }))
          .sort(
            (a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime()
          );
        setWeeks(fetchedWeeks);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching weeks:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, selectedWorkspace]);

  // Add a new week (empty for editing)
  const handleAddWeek = () => {
    const confirmed = window.confirm("האם ברצונך להוסיף שבוע?");
    
    if (!confirmed) {
      return;
    }

    const currentWeekStart = getWeekStart(new Date());
    setWeeks([{ weekStartDate: currentWeekStart, isNew: true }, ...weeks]);
  };

  if (loading) {
    return <LoadingSpinner message="טוען שבועות..." />;
  }

  return (
    <div className={styles.weekPlannerContainer}>
      <button className={styles.addWeekButton} onClick={handleAddWeek}>
        הוסף שבוע
      </button>

      <div className={styles.weeksContainer}>
        {weeks.map((week) => (
          <WeekPlanner
            key={week.id || "new"}
            weekStart={week.weekStartDate}
            weekData={week.isNew ? null : week}
            onWeekSaved={() => {
              // Refresh weeks after save
              setWeeks(weeks.filter((w) => w.id !== "new"));
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default WeekPlannerView;

