import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import styles from "./TasksView.module.css";
function formatFirestoreDate(date) {
  if (!date) return "";

  // Firestore Timestamp
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString("he-IL");
  }

  // JS Date or string
  return new Date(date).toLocaleDateString("he-IL");
}
function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null); // task object or null
  const [addingTask, setAddingTask] = useState(false); // for new task
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editLevel, setEditLevel] = useState("a");
  const [editDone, setEditDone] = useState(false);
  const [issues, setIssues] = useState([]);

  const levelPriority = { c: 0, b: 1, a: 2 };

  async function handleAddTask() {
  const colRef = collection(db, "tasks");

  await addDoc(colRef, {
    title: editTitle,
    text: editText,
    level: editLevel,
    done: false,
    date: new Date().toISOString().split("T")[0],
  });

  // Don't update local state
  setEditingTask(null);
}
async function handleModalSave() {
  if (editingTask) {
    // UPDATE existing task
    const docRef = doc(db, "tasks", editingTask.id);
    await updateDoc(docRef, {
      title: editTitle,
      text: editText,
      level: editLevel,
      done: editDone,
    });

    // Update local state instantly for UX
    setTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id
          ? { ...t, title: editTitle, text: editText, level: editLevel, done: editDone }
          : t
      )
    );
  } else if (addingTask) {
    // CREATE new task
    const colRef = collection(db, "tasks");
    await addDoc(colRef, {
      title: editTitle,
      text: editText,
      level: editLevel,
      done: editDone,
      date: new Date().toLocaleDateString(),
    });

    // DO NOT update local state manually!
    // onSnapshot will automatically add it
  }

  // Close modal
  setEditingTask(null);
  setAddingTask(false);
}




  async function handleDeleteTask() {
    if (!editingTask) return;
    const docRef = doc(db, "tasks", editingTask.id);
    await deleteDoc(docRef);
    setTasks(prev => prev.filter(t => t.id !== editingTask.id));
    setEditingTask(null);
  }

  useEffect(() => {
  const colRef = collection(db, "tasks");

  const unsub = onSnapshot(
    colRef,
    snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        type: "task",   // 👈 הוספה כאן
        ...doc.data(),
      }));

      setTasks(data);
      setLoading(false);
    },
    error => {
      console.error("🔥 Firestore onSnapshot error:", error);
      setLoading(false);
    }
  );

  return () => unsub();
}, []);

  useEffect(() => {
  const colRef = collection(db, "gardens");

  const unsub = onSnapshot(colRef, snapshot => {
    const allIssues = [];

    snapshot.docs.forEach(doc => {
      const garden = doc.data();
      // const gardenTitle = garden.title;
      

      (garden.requiresAttention || []).forEach(issue => {
        const newDate = formatFirestoreDate(issue.createdAt)
        if (!issue.resolved) {
          allIssues.push({
            id: issue.id,
            type: "issue",
            title: "דורש טיפול",
            text: issue.text,
            done: issue.resolved,
            date: newDate,
            gardenTitle:issue.gardenName,
          });
        }
      });
    });

    setIssues(allIssues);
  });

  return () => unsub();
}, []);

  if (loading) return <p className={styles.loading}>טוען משימות...</p>;
  // if (tasks.length === 0) return <p className={styles.empty}>אין משימות 🎉</p>;

  const sortedTasks = [...tasks].sort((a, b) => (levelPriority[a.level] ?? 99) - (levelPriority[b.level] ?? 99));
  const combinedList = [...tasks, ...issues];
  console.log(combinedList)
  return (
    <div className={styles.container}>
      <button className={styles.addTaskButton} onClick={() => {
        setAddingTask(true);
        setEditingTask(null);
        setEditTitle("");
        setEditText("");
        setEditLevel("a");
        setEditDone(false);
      }}>
        הוסף משימה +
      </button>

      <ul className={styles.list}>
  {combinedList.map(item => {
    // ---------- TASK ----------
    if (item.type === "task") {
      return (
        <li
          key={item.id}
          className={`${styles.taskCard} ${item.done ? styles.completed : ""}`}
          onClick={() => {
            setEditingTask(item);
            setAddingTask(false);
            setEditTitle(item.title);
            setEditText(item.text);
            setEditLevel(item.level);
            setEditDone(item.done);
          }}
        >
          <div className={styles.taskHeader}>
            <span className={styles.taskTitle}>{item.title}</span>
            {item.done && <span className={styles.doneMark}>✔</span>}
          </div>

          <p className={styles.taskText}>{item.text}</p>

          <div className={styles.taskMeta}>
            <span className={styles.taskDate}>תאריך: {item.date}</span>
            <span className={styles.taskLevel}>
              רמה: {item.level?.toUpperCase()}
            </span>
          </div>
        </li>
      );
    }

    // ---------- ISSUE ----------
    if (item.type === "issue") {
      return (
        <li
  key={item.id}
  className={`${styles.taskCard} ${item.done ? styles.completed : ""}`}
>
  {/* top row */}
  <div className={styles.issueTop}>
    <span className={styles.issueText}>
      ⚠️ {item.text}
    </span>

    <span
      className={`${styles.issueStatus} ${
        item.done ? styles.resolved : styles.unresolved
      }`}
    >
      {item.done ? "טופל" : "לא טופל"}
    </span>
  </div>

  {/* meta row */}
  <div className={styles.issueMeta}>
    {item.gardenTitle && (
      <span className={styles.issueGarden}>
        🌱 {item.gardenTitle}
      </span>
    )}

    {item.date && (
      <span className={styles.issueDate}>
        נוצר בתאריך: {item.date}
      </span>
    )}
  </div>
</li>


      );
    }

    return null;
  })}
</ul>


      {(editingTask || addingTask) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editingTask ? "ערוך משימה" : "הוסף משימה"}</h3>

            <label>כותרת:</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />

            <label>תוכן:</label>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} />

            <label>רמה:</label>
            <select value={editLevel} onChange={e => setEditLevel(e.target.value)}>
              <option value="c">C - גבוהה</option>
              <option value="b">B - בינונית</option>
              <option value="a">A - נמוכה</option>
            </select>

            <label>
              <input type="checkbox" checked={editDone} onChange={e => setEditDone(e.target.checked)} />
              בוצעה
            </label>

            <div className={styles.modalButtons}>
              <button onClick={handleModalSave}>
  {editingTask ? "שמור" : "הוסף"}
</button>

              {editingTask && <button onClick={handleDeleteTask} className={styles.deleteButton}>מחיקה</button>}
              <button onClick={() => { setEditingTask(null); setAddingTask(false); }}>בטל</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksView;
