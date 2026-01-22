import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import styles from "./TasksView.module.css";

export default function TaskListItem({ task, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const threshold = 100;
  const redIntensity = Math.min(Math.abs(translateX) / threshold, 1);
  const swipeRed = `rgba(200, 60, 60, ${redIntensity * 0.7})`;

  const handlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (deltaX > 0) {
        setTranslateX(deltaX);
        setSwiping(true);
      }
    },
    onSwipedRight: ({ deltaX }) => {
      setSwiping(false);
      setTranslateX(0);

      if (deltaX > threshold && onDelete) {
        onDelete(task);
      }
    },
    onSwipedLeft: () => {
      setSwiping(false);
      setTranslateX(0);
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  if (!task) return null;

  return (
    <li
      {...handlers}
      className={styles.taskCard}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: swiping ? "none" : "transform 0.2s ease",
        backgroundColor: translateX > 0 ? swipeRed : undefined,
        color: translateX > threshold / 2 ? "white" : undefined,
      }}
    >
      {/* ---------- TASK ---------- */}
      {task.type === "task" && (
        <>
          <div className={styles.taskHeader}>
            <span className={styles.taskTitle}>{task.title}</span>
            {task.done && <span className={styles.doneMark}>✔</span>}
          </div>

          {task.text && <p className={styles.taskText}>{task.text}</p>}

          <div className={styles.taskMeta}>
            {task.date && <span>{task.date}</span>}
          </div>
        </>
      )}

      {/* ---------- ISSUE ---------- */}
      {task.type === "issue" && (
        <>
          <div className={styles.issueTop}>
            <span className={styles.issueText}>⚠️ {task.text}</span>
            <span className={styles.unresolved}>לא טופל</span>
          </div>

          <div className={styles.issueMeta}>
            <span>🌱 {task.gardenTitle}</span>
            {task.date && <span>נוצר: {task.date}</span>}
          </div>
        </>
      )}
    </li>
  );
}
