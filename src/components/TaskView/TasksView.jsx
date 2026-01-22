import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import styles from "./TasksView.module.css";
import TaskListItem from "./TaskListItem.jsx";
import { FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth.js";
import { useGardensContext } from "../../context/GardensContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner.jsx";

function formatFirestoreDate(date) {
  if (!date) return "";

  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString("he-IL");
  }

  return new Date(date).toLocaleDateString("he-IL");
}

function TasksView() {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const { gardens } = useGardensContext();
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");

  useEffect(() => {
    if (!user || !selectedWorkspace) {
      setTasks([]);
      return;
    }

    const tasksQuery = query(
      collection(db, "tasks"),
      where("workspaceId", "==", selectedWorkspace)
    );

    const unsub = onSnapshot(tasksQuery, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        type: "task",
        ...doc.data(),
      }));

      setTasks(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user, selectedWorkspace]);

  useEffect(() => {
    // Use gardens from context instead of fetching again
    const allIssues = [];

    gardens.forEach(garden => {
      (garden.requiresAttention || []).forEach(issue => {
        if (!issue.resolved) {
          allIssues.push({
            id: issue.id,
            type: "issue",
            title: "דורש טיפול",
            text: issue.text,
            done: issue.resolved,
            date: formatFirestoreDate(issue.createdAt),
            gardenTitle: issue.gardenName,
          });
        }
      });
    });

    setIssues(allIssues);
  }, [gardens]);
  async function handleAddTask() {
    if (!newTitle.trim()) return;
    if (!user || !selectedWorkspace) {
      alert("חייב להתחבר קודם");
      return;
    }

    await addDoc(collection(db, "tasks"), {
      title: newTitle,
      text: newText,
      done: false,
      date: new Date().toISOString().split("T")[0],
      userId: user.uid,
      workspaceId: selectedWorkspace,
    });

    // reset UI only — snapshot will update tasks
    setNewTitle("");
    setNewText("");
    setAdding(false);
  }


async function deleteTask(task) {
  await deleteDoc(doc(db, "tasks", task.id));
  setTasks(prev => prev.filter(t => t.id !== task.id));
}

async function deleteIssue(issue) {
  const gardensRef = collection(db, "gardens");
  const snapshot = await getDocs(gardensRef);

  for (const g of snapshot.docs) {
    const garden = g.data();
    const current = garden.requiresAttention || [];

    const updated = current.filter(i => i.id !== issue.id);

    if (updated.length !== current.length) {
      await updateDoc(doc(db, "gardens", g.id), {
        requiresAttention: updated,
      });
      break; // stop once found
    }
  }

  setIssues(prev => prev.filter(i => i.id !== issue.id));
}


/**
 * 🔁 Single delete handler
 */
async function handleDelete(item) {
  console.log(item)
  const label =
    item.type === "task"
      ? `למחוק את "${item.title}"?`
      : "למחוק את התקלה?";

  const ok = window.confirm(label);
  if (!ok) return;

  if (item.type === "task") {
    await deleteTask(item);
  } else if (item.type === "issue") {
    await deleteIssue(item);
  }
}

  if (loading) {
    return <LoadingSpinner message="טוען משימות..." />;
  }

  const combinedList = [...tasks, ...issues];

  return (
    <div className={styles.container}>
    <button
  className={styles.addTaskButton}
  onClick={() => setAdding(true)}
>
  הוסף משימה +
</button>
{adding && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3>הוסף משימה</h3>

      <label>כותרת</label>
      <input
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
      />

      <label>תוכן</label>
      <textarea
        value={newText}
        onChange={e => setNewText(e.target.value)}
      />

      <div className={styles.modalButtons}>
        <button onClick={handleAddTask}>הוסף</button>
        <button onClick={() => setAdding(false)}>בטל</button>
      </div>
    </div>
  </div>
)}

      <ul className={styles.list}>
        {combinedList.map(item => (
          <TaskListItem
            key={item.id}
            task={item}
            onDelete={handleDelete}
          />
        ))}
      </ul>
      <div className={styles.swipeHint}>
                <FaArrowRight style={{ marginRight: "6px" }} />
                החלק ימינה למחיקה
              </div>
      
    </div>
  );
}

export default TasksView;
