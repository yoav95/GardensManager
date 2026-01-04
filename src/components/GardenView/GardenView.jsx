import { useGardens } from "../../hooks/useGardens";
import styles from "./GardenView.module.css";

import { useState } from "react";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
const colorMap = {
  sunday: "#E76F51",     // Muted terracotta red
  monday: "#2A9D8F",     // Calm teal green
  tuesday: "#E9C46A",    // Soft mustard
  wednesday: "#577590",  // Slate blue
  thursday: "#F4A261",   // Warm sand / orange
};


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
  const [searchTerm, setSearchTerm] = useState("");
  


const visibleGardens = gardens.filter((g) => {
  const matchesDay = selectedDay ? g.day === selectedDay : true;
  const matchesSearch = g.name
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase());

  return matchesDay && matchesSearch;
});



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
  onFocus={() => setSelectedDay("")}   // 👈 important
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
  <div className={`${styles.dayIndicator} ${styles[`day${g.day.charAt(0).toUpperCase() + g.day.slice(1)}`]}`}></div>

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
      {g.lastVisit ? (
        <p className={styles.okVisit}>{formatDate(g.lastVisit)}</p>
      ) : (
        <p className={styles.noVisit}>אין ביקורים עדיין</p>
      )}
    </div>
    <div className={styles.cardButtons}>
      <button
        className={styles.navButton}
        onClick={(e) => {
          e.stopPropagation();
          window.location.href = `https://waze.com/ul?q=${g.locationURL ? g.locationURL : ""}`;
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
