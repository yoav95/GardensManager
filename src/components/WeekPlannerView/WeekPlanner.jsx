import styles from "./WeekPlanner.module.css";
import WeekPlannerMap from "./WeekPlannerMap";
import { useState } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../context/WorkspaceContext";

function WeekPlanner({ weekStart, weekData, onWeekSaved }) {
  const { user } = useAuth();
  const { selectedWorkspace, workspaces } = useWorkspace();
  const [selectedGarden, setSelectedGarden] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!weekData); // New weeks are expanded by default

  // Get the full workspace object
  const currentWorkspace = workspaces.find((ws) => ws.id === selectedWorkspace);

  // Initialize with existing week data or empty
  const [weekGardens, setWeekGardens] = useState(
    weekData?.days || {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    }
  );
  // Generate the 7 days of the week starting from weekStart (Sunday)
  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const days = getDaysOfWeek();
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

  // Format date as DD/MM/YYYY
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDayClick = (dayIndex) => {
    if (!selectedGarden) {
      alert("אנא בחר גינה מהמפה");
      return;
    }

    // Add garden to the day
    setWeekGardens((prev) => {
      const dayGardens = prev[dayIndex];
      // Check if garden already exists in this day
      if (dayGardens.some((g) => g.id === selectedGarden.id)) {
        return prev;
      }
      return {
        ...prev,
        [dayIndex]: [...dayGardens, selectedGarden],
      };
    });

    setSelectedGarden(null);
  };

  const handleRemoveGarden = (dayIndex, gardenId) => {
    setWeekGardens((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((g) => g.id !== gardenId),
    }));
  };

  // Check if a day is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleSaveWeek = async () => {
    if (!user || !selectedWorkspace || !currentWorkspace) {
      alert("נתונים חסרים. אנא נסה שוב.");
      return;
    }

    // Check if any gardens are assigned
    const hasGardens = Object.values(weekGardens).some((day) => day.length > 0);
    if (!hasGardens) {
      alert("אנא הוסף לפחות גינה אחת לשבוע");
      return;
    }

    setIsSaving(true);

    try {
      const weekData = {
        workspaceId: selectedWorkspace,
        userId: user.uid,
        weekStartDate: new Date(weekStart),
        weekEndDate: new Date(new Date(weekStart).setDate(weekStart.getDate() + 5)),
        days: weekGardens,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "weeks"), weekData);
      alert("השבוע נשמר בהצלחה!");
      // Reset after save
      setWeekGardens({
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
      });
      if (onWeekSaved) {
        onWeekSaved();
      }
    } catch (error) {
      console.error("Error saving week:", error);
      alert("שגיאה בשמירת השבוע. אנא נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.weekContainer}>
      <div
        className={styles.weekHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerLeft}>
          <span className={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
          <h2 className={styles.weekHeaderTitle}>
            שבוע של {formatDate(days[0])} - {formatDate(days[5])}
          </h2>
        </div>
        {weekData && (
          <div className={styles.gardenCount}>
            {Object.values(weekGardens).reduce((sum, day) => sum + day.length, 0)} גינות
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={styles.weekContent}>
          <h2 className={styles.weekTitle} style={{ display: "none" }}>
            שבוע של {formatDate(days[0])} - {formatDate(days[5])}
          </h2>
          {selectedGarden && (
            <div className={styles.selectedGardenInfo}>
              גינה נבחרת: <strong>{selectedGarden.name}</strong> - לחץ על יום כדי להוסיף
            </div>
          )}
          <WeekPlannerMap
            selectedGarden={selectedGarden}
            onSelectGarden={setSelectedGarden}
          />
          <table className={styles.weekTable}>
        <thead>
          <tr>
            {days.map((day, index) => (
              <th key={index} className={styles.dayHeader}>
                <div className={styles.dayName}>{dayNames[index]}</div>
                <div className={styles.dayDate}>{formatDate(day)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {days.map((day, index) => (
              <td
                key={index}
                className={`${styles.dayCell} ${
                  isToday(day) ? styles.todayCell : ""
                }`}
                onClick={() => handleDayClick(index)}
                style={{
                  cursor: selectedGarden ? "pointer" : "default",
                  backgroundColor: isToday(day)
                    ? "#e8d5f2"
                    : selectedGarden
                    ? "#e8f5e9"
                    : "#fafafa",
                }}
              >
                <div className={styles.dayGardens}>
                  {weekGardens[index].map((garden) => (
                    <div key={garden.id} className={styles.gardenTag}>
                      <span>{garden.name}</span>
                      <button
                        className={styles.removeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGarden(index, garden.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {weekGardens[index].length === 0 && (
                  <div className={styles.emptyDayPlaceholder}>
                    {selectedGarden ? "לחץ כאן" : ""}
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <button className={styles.saveButton} onClick={handleSaveWeek} disabled={isSaving}>
        {isSaving ? "שומר..." : "שמור שבוע"}
      </button>
        </div>
      )}
    </div>
  );
}

export default WeekPlanner;

