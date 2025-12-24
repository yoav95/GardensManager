import { useGardens } from "./hooks/useGardens";
import styles from "./GardenView.module.css";

import { useState } from "react";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

function GardenView() {
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
  className={styles.fabAdd}
  onClick={() => (window.location.href = "/new-garden")}
>
  +
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
                  src={g.imageURL}
                  className={styles.image}
                  alt={g.name}
                />
              </div>

              <div className={styles.info}>
                <div className={styles.title}>{g.name}</div>
                <div className={styles.address}>{g.address}</div>
                <div className={styles.lastVisit}>
                  ביקור אחרון:{" "}
                  {g.lastVisit ? <p className={styles.okVisit}>{formatDate(g.lastVisit)}</p> : <p className={styles.noVisit}>אין ביקורים עדיין</p>}
                 
                </div>
                <div className={styles.cardButtons}>
                  <button
                    className={styles.navButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `https://waze.com/ul?q=${g.locationURL ? g.locationURL : ""}`
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

export default GardenView;
