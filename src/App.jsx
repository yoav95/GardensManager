import { useGardens } from "./hooks/useGardens";
import styles from "./app.module.css";

import { useState } from "react";

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
      <h1 className={styles.appTitle}>ניהול גינות</h1>

      {/* Filter + Add Garden */}
      <div className={styles.control}>
        <div className={styles.dayBar}>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`${styles.dayButton} ${selectedDay === day ? styles.active : ""}`}
            >
              {daysHebrew[day]}
            </button>
          ))}
          <button
            onClick={() => setSelectedDay("")}
            className={`${styles.dayButton} ${selectedDay === "" ? styles.active : ""}`}
          >
            הכל
          </button>
        </div>
        <button
          className={styles.addGardenButton}
          onClick={() => (window.location.href = "/new-garden")}
        >
          ➕ הוסף גן חדש
        </button>
      </div>

      {gardens.length === 0 ? (
        <p className={styles.emptyMessage}>אין גנים עדיין.</p>
      ) : (
        <ul className={styles.list}>
          {visibleGardens.map((g) => (
            <li
              key={g.id}
              className={styles.card}
              onClick={() => (window.location.href = `/garden/${g.id}`)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={g.imageURL || "/assets/1.jpg"}
                  className={styles.image}
                  alt={g.name}
                />
              </div>

              <div className={styles.info}>
                <div className={styles.title}>{g.name}</div>
                <div className={styles.address}>{g.address}</div>
                <div className={styles.lastVisit}>
                  ביקור אחרון:{" "}
                  <strong>
                    {g.lastVisit ? formatDate(g.lastVisit) : "אין ביקורים עדיין"}
                  </strong>
                </div>
                <div className={styles.cardButtons}>
                  <button
                    className={styles.button}
                    onClick={(e) => {
                      e.stopPropagation();
                      alert("ניווט בקרוב!");
                    }}
                  >
                    ניווט
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
