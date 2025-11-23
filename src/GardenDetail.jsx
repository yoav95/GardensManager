import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import styles from "./GardenDetail.module.css";

function GardenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);

  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  const [addingVisit, setAddingVisit] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tasksDone, setTasksDone] = useState("");
  const [nextTasks, setNextTasks] = useState("");
  const [expandedVisit, setExpandedVisit] = useState(null); // store index of expanded visit
  const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

useEffect(() => {
  async function fetchGarden() {
    try {
      const docRef = doc(db, "gardens", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setGarden(docSnap.data());
      } else {
        console.warn(`Garden with id "${id}" not found.`);
        setGarden(null);
      }
    } catch (error) {
      console.error("Error fetching garden:", error);
      alert("שגיאה בטעינת הגן. בדוק את הקונסול לפרטים.");
    }
  }

  fetchGarden();
}, [id]);


  if (!garden) return <p>Loading garden...</p>;

  // -----------------------
  // SAVE NOTE TO FIRESTORE
  // -----------------------
  async function handleAddNote() {
    if (!newNote.trim()) return;
    const docRef = doc(db, "gardens", id);
    const updatedNotes = garden.notes ? [...garden.notes, newNote] : [newNote];
    await updateDoc(docRef, { notes: updatedNotes });
    setGarden(prev => ({ ...prev, notes: updatedNotes }));
    setNewNote("");
    setAddingNote(false);
  }
  function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}


  async function handleDeleteNote(index) {
    const docRef = doc(db, "gardens", id);
    const updatedNotes = garden.notes.filter((_, i) => i !== index);
    await updateDoc(docRef, { notes: updatedNotes });
    setGarden(prev => ({ ...prev, notes: updatedNotes }));
  }

async function handleAddVisit() {
  if (!tasksDone.trim() && !nextTasks.trim()) return;

  const docRef = doc(db, "gardens", id);

  const newLog = {
    date: visitDate,
    tasks: tasksDone.split("\n").filter(t => t.trim()),
    nextVisitTasks: nextTasks.split("\n").filter(t => t.trim()),
  };

  const updatedLogs = garden.visitLogs
    ? [...garden.visitLogs, newLog]
    : [newLog];

  await updateDoc(docRef, { 
    visitLogs: updatedLogs,
    lastVisit: visitDate
  });

  setGarden(prev => ({ 
    ...prev, 
    visitLogs: updatedLogs,
    lastVisit: visitDate
  }));

  setVisitDate(new Date().toISOString().split("T")[0]);
  setTasksDone("");
  setNextTasks("");
  setAddingVisit(false);
}


  async function handleDeleteVisit(index) {
    const docRef = doc(db, "gardens", id);
    const updatedLogs = garden.visitLogs.filter((_, i) => i !== index);
    await updateDoc(docRef, { visitLogs: updatedLogs   });
    setGarden(prev => ({ ...prev, visitLogs: updatedLogs }));
  }

  return (
    <div className={styles.container} style={{ direction: "rtl" }}>
      <div className={styles.top}>
        <h1 className={styles.title}>{garden.name}</h1>
        <button
        className={styles.button}
        onClick={() => navigate("/")}
      >
        ← חזור
      </button>

      
      </div>

      <div className={styles.section}>
        <div className={styles.gardenImageWrapper}>
          {garden.imageURL ? (
            <img src="./assets/1.jpg" alt={garden.name} className={styles.gardenImage} />
          ) : (
            <div className={styles.gardenImagePlaceholder}>No Image</div>
          )}
        </div>

        <p>
          <span className={styles.label}>כתובת:</span>
          <span className={styles.value}>{garden.address}</span>
        </p>

       <p>
  <span className={styles.label}>ביקור אחרון:</span>
  <span className={styles.value}>
    {garden.lastVisit ? formatDate(garden.lastVisit) : "אין ביקורים עדיין"}
  </span>
</p>


        <p>
  <strong>יום:</strong> {daysHebrew[garden.day] || garden.day}
</p>
        <p>
          <strong>ימי הוצאה:</strong> {garden.outDays}        </p>
        <button className={styles.button}>
          נווט לגינה
        </button>

        
      </div>

      {/* Notes Section */}
      <div className={styles.section}>
        <div className={styles.notesHeader}>
          <div className={styles.label}>הערות:</div>
        </div>

        {garden.notes?.length > 0 ? (
          <div className={styles.notesList}>
            {garden.notes.map((note, idx) => (
              <div key={idx} className={styles.noteItem}>
                <span>{note}</span>
                <button className={styles.deleteButton} onClick={() => handleDeleteNote(idx)}>✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noNotes}>אין הערות עדיין.</p>
        )}

        {addingNote && (
          <div className={styles.noteInputWrapper}>
            <input
              type="text"
              placeholder="כתוב הערה..."
              className={styles.noteInput}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button className={styles.saveNoteButton} onClick={handleAddNote}>שמור</button>
          </div>
        )}
        <button className={styles.button} onClick={() => setAddingNote(!addingNote)}>
          + הוסף הערה
        </button>
      </div>

      {/* Visit Logs Section */}
      <div className={styles.section}>
        <div className={styles.logsTitle}>יומני ביקור</div>
        {garden.visitLogs && garden.visitLogs.length > 0 ? (
          garden.visitLogs.map((visit, idx) => (
            <div key={idx} className={styles.logItem}>
    <div className={styles.logHeader} 
         onClick={() => setExpandedVisit(expandedVisit === idx ? null : idx)}
         style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", alignItems: "center" }}>
      <div className={styles.logDate}>📅 {formatDate(visit.date)}</div>
      <button
        className={styles.deleteButtonSmall}
        onClick={(e) => { e.stopPropagation(); handleDeleteVisit(idx); }}
      >
        ✕
      </button>
    </div>

    {expandedVisit === idx && (
  <div className={styles.logContent}>
    <div className={styles.section}>
      <div className={styles.logTasksTitle}>משימות שבוצעו</div>
      <ul className={styles.taskList}>
        {visit.tasks.map((task, tIdx) => <li key={tIdx}>{task}</li>)}
      </ul>
    </div>

    <div className={styles.section}>
      <div className={styles.logTasksTitle}>משימות לביקור הבא</div>
      <ul className={styles.taskList}>
        {visit.nextVisitTasks.map((task, nIdx) => <li key={nIdx}>{task}</li>)}
      </ul>
    </div>
  </div>
)}
  </div>

          ))
        ) : (
          <p className={styles.noLogs}>אין יומני ביקור עדיין.</p>
        )}

        <button className={styles.button} onClick={() => setAddingVisit(!addingVisit)}>
          + הוסף יומן ביקור
        </button>

        {addingVisit && (
          <div className={styles.visitForm}>
            <label className={styles.label}>תאריך:</label>
            <input type="date" className={styles.input} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />

            <label className={styles.label}>משימות שבוצעו:</label>
            <textarea className={styles.textarea} placeholder="משימה בשורה" value={tasksDone} onChange={(e) => setTasksDone(e.target.value)} />

            <label className={styles.label}>משימות לביקור הבא:</label>
            <textarea className={styles.textarea} placeholder="משימה בשורה" value={nextTasks} onChange={(e) => setNextTasks(e.target.value)} />

            <button className={styles.saveNoteButton} onClick={handleAddVisit}>שמור יומן</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GardenDetail;
