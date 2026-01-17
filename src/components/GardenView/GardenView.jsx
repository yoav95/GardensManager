import { useGardens } from "../../hooks/useGardens";
import styles from "./GardenView.module.css";

import { useState, useMemo, memo } from "react";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

// Memoized garden card component
const GardenCard = memo(({ garden, formatDate }) => (
  <li
    className={styles.card}
    onClick={() => (window.location.href = `/garden/${garden.id}`)}
  >
    <div className={`${styles.dayIndicator} ${styles[`day${garden.day.charAt(0).toUpperCase() + garden.day.slice(1)}`]}`}></div>

    <div className={styles.imageWrapper}>
      <img
        src={garden.imageURL}
        className={styles.image}
        alt={garden.name}
        loading="lazy"
      />
    </div>

    <div className={styles.info}>
      <div className={styles.title}>{garden.name}</div>
      <div className={styles.address}>{garden.address}</div>
      <div className={styles.lastVisit}>
        ביקור אחרון:{" "}
        {garden.lastVisit ? (
          <p className={styles.okVisit}>{formatDate(garden.lastVisit)}</p>
        ) : (
          <p className={styles.noVisit}>אין ביקורים עדיין</p>
        )}
      </div>
      <button
        className={styles.navButton}
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = `https://waze.com/ul?q=${garden.locationURL ? garden.locationURL : ""}`;
        }}
      >
        ניווט
      </button>
    </div>
  </li>
));

GardenCard.displayName = "GardenCard";

function GardenView() {
  const { gardens, loading, error } = useGardens();
  const [selectedDay, setSelectedDay] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize filtering to prevent recalculation on every render
  const visibleGardens = useMemo(() => {
    return gardens.filter((g) => {
      const matchesDay = selectedDay ? g.day === selectedDay : true;
      const matchesSearch = g.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesDay && matchesSearch;
    });
  }, [gardens, selectedDay, searchTerm]);



  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return (
    <div className={styles.container}>
      {/* Filter + Add Garden */}
      <div className={styles.control}>
        {/* Day filter bar */}
        <div className={styles.dayBar}>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`${styles.dayButton} ${styles[day]} ${
                selectedDay === day ? styles.active : ""
              }`}
            >
              {daysHebrew[day]}
            </button>
          ))}

          <button
            onClick={() => setSelectedDay("")}
            className={`${styles.dayButton} ${styles.all} ${
              selectedDay === "" ? styles.active : ""
            }`}
          >
            הכל
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="חפש גינה..."
            value={searchTerm}
            onFocus={() => setSelectedDay("")}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Floating Add Button */}
        <button
          className={styles.fabAdd}
          onClick={() => (window.location.href = "/new-garden")}
        >
          +
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <p className={styles.emptyMessage}>טוען גנים...</p>
      )}

      {/* Error State */}
      {error && (
        <p className={styles.emptyMessage} style={{ color: "red" }}>
          שגיאה בטעינת הגנים. בדוק את הקונסול.
        </p>
      )}

      {/* Empty State */}
      {!loading && !error && gardens.length === 0 && (
        <p className={styles.emptyMessage}>אין גנים עדיין.</p>
      )}

      {/* Gardens List */}
      {!loading && !error && gardens.length > 0 && (
        <ul className={styles.list}>
          {visibleGardens.length === 0 ? (
            <p className={styles.emptyMessage}>לא נמצאו תוצאות</p>
          ) : (
            visibleGardens.map((g) => (
              <GardenCard key={g.id} garden={g} formatDate={formatDate} />
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default GardenView;