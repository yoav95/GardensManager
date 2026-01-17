import TopButton from "../TopButton/TopButton.jsx";
import styles from "../../App.module.css";

function Navigation({ view, setView, gardenCount, totalBadgeCount, shoppingCount }) {
  return (
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
        badgeVariant="info"
      />
    </div>
  );
}

export default Navigation;
