import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc,updateDoc, arrayUnion, serverTimestamp, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
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
  const [editingDay, setEditingDay] = useState(false);
const [newDay, setNewDay] = useState("");
const [editingOutDays, setEditingOutDays] = useState(false);
const [newOutDays, setNewOutDays] = useState("");
const [editingImage, setEditingImage] = useState(false);
const [newImageURL, setNewImageURL] = useState("");


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

async function handleDeleteGarden() {
  const confirmed = window.confirm(
    "האם אתה בטוח שברצונך למחוק את הגינה?\nהפעולה אינה ניתנת לביטול."
  );

  if (!confirmed) return;

  try {
    const docRef = doc(db, "gardens", id);
    await deleteDoc(docRef);

    alert("הגינה נמחקה בהצלחה");
    navigate("/");
  } catch (error) {
    console.error("Error deleting garden:", error);
    alert("שגיאה במחיקת הגינה");
  }
}



  

  
  // -----------------------
  // SAVE NOTE TO FIRESTORE
  // -----------------------
async function handleAddNote() {
  if (!newNote.trim()) return;

  const docRef = doc(db, "gardens", id);

  const updatedNotes = garden.notes
    ? [...garden.notes, newNote]
    : [newNote];

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
async function handleUpdateImage() {
  if (!newImageURL.trim()) return;

  const docRef = doc(db, "gardens", id);

  await updateDoc(docRef, { imageURL: newImageURL });

  setGarden(prev => ({ ...prev, imageURL: newImageURL }));
  setEditingImage(false);
}



  async function handleDeleteNote(index) {
    const docRef = doc(db, "gardens", id);
    const updatedNotes = garden.notes.filter((_, i) => i !== index);
    await updateDoc(docRef, { notes: updatedNotes }, { merge: true });
    setGarden(prev => ({ ...prev, notes: updatedNotes }));
  }


async function handleAddVisit() {
  if (!tasksDone.trim() && !nextTasks.trim()) return;

  const docRef = doc(db, "gardens", id);

  const newLog = {
    date: visitDate, // string / date you already use
    tasks: tasksDone.split("\n").filter(t => t.trim()),
    nextVisitTasks: nextTasks.split("\n").filter(t => t.trim()),
    createdAt: Timestamp.now(), // ✅ allowed
  };

  await updateDoc(docRef, {
    visitLogs: arrayUnion(newLog),
    lastVisit: visitDate,
  });

  // optimistic UI update
  setGarden(prev => ({
    ...prev,
    visitLogs: [...(prev.visitLogs || []), newLog],
    lastVisit: visitDate,
  }));

  setTasksDone("");
  setNextTasks("");
  setAddingVisit(false);
}
async function handleUpdateDay() {
  if (!newDay) return;

  const docRef = doc(db, "gardens", id);

  await updateDoc(docRef, { day: newDay }, { merge: true });

  setGarden(prev => ({ ...prev, day: newDay }));
  setEditingDay(false);
}
async function handleUpdateOutDays() {
  if (!newOutDays.trim()) return;

  const docRef = doc(db, "gardens", id);

  await updateDoc(docRef, { outDays: newOutDays }, { merge: true });


  setGarden(prev => ({ ...prev, outDays: newOutDays }));
  setEditingOutDays(false);
}



  async function handleDeleteVisit(index) {
    const docRef = doc(db, "gardens", id);
    const updatedLogs = garden.visitLogs.filter((_, i) => i !== index);
    await updateDoc(docRef, { visitLogs: updatedLogs   },{ merge: true });
    setGarden(prev => ({ ...prev, visitLogs: updatedLogs }));
  }

  if (!garden) return <p>Loading garden...</p>;

  return (
    <div className={styles.container} style={{ direction: "rtl" }}>
      <div className={styles.top}>
        <h1 className={styles.title}>{garden.name}</h1>
        <button
        className={styles.backButton}
        onClick={() => navigate("/")}
      >
        ← חזור
      </button>

      
      </div>

      <div className={styles.section}>
        <div className={styles.gardenImageWrapper}>
          {garden.imageURL ? (
            <img src={garden.imageURL} alt={garden.name} className={styles.gardenImage} />
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


   <div className={styles.sectionRow}>
  <p>
    <strong>יום:</strong> {daysHebrew[garden.day] || garden.day}
  </p>

  {!editingDay && (
    <button 
      className={styles.buttonSmall} 
      onClick={() => {
        setNewDay(garden.day);
        setEditingDay(true);
      }}
    >
      ערוך יום
    </button>
  )}
</div>

{editingDay && (
  <div className={styles.editDayWrapper}>
    <select 
      className={styles.input}
      value={newDay} 
      onChange={(e) => setNewDay(e.target.value)}
    >
      <option value="sunday">ראשון</option>
      <option value="monday">שני</option>
      <option value="tuesday">שלישי</option>
      <option value="wednesday">רביעי</option>
      <option value="thursday">חמישי</option>
    </select>

    <button className={styles.saveNoteButton} onClick={handleUpdateDay}>
      שמור
    </button>
    <button 
      className={styles.deleteButtonSmall} 
      style={{ marginLeft: 8 }} 
      onClick={() => setEditingDay(false)}
    >
      ביטול
    </button>
  </div>
)}

       <div className={styles.sectionRow}>
  <p>
    <strong>ימי הוצאה:</strong> {garden.outDays}
  </p>

  {!editingOutDays && (
    <button
      className={styles.buttonSmall}
      onClick={() => {
        setNewOutDays(garden.outDays || "");
        setEditingOutDays(true);
      }}
    >
      ערוך
    </button>
  )}
</div>

{editingOutDays && (
  <div className={styles.editDayWrapper}>
    <input
      type="text"
      className={styles.input}
      placeholder="לדוגמה: ראשון ורביעי"
      value={newOutDays}
      onChange={(e) => setNewOutDays(e.target.value)}
    />

    <button className={styles.saveNoteButton} onClick={handleUpdateOutDays}>
      שמור
    </button>

    <button
      className={styles.deleteButtonSmall}
      style={{ marginLeft: 8 }}
      onClick={() => setEditingOutDays(false)}
    >
      ביטול
    </button>
  </div>
)}

        <button className={styles.navButton} onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `https://waze.com/ul?q=${garden.locationURL ? garden.locationURL : ""}`
                    }}>
          ניווט
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
    <span>
      {typeof note === "string" ? note : note.text}
    </span>
    <button
      className={styles.deleteButton}
      onClick={() => handleDeleteNote(idx)}
    >
      ✕
    </button>
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
      {/* TEMP IMAGE EDIT CARD */}
<div className={styles.section} style={{ marginTop: 32 }}>
  <h3 className={styles.label}>🖼️ תמונת גינה (זמני)</h3>

  {!editingImage && (
    <>
      <p className={styles.value}>
        {garden.imageURL ? garden.imageURL : "אין תמונה"}
      </p>
      <button
        className={styles.buttonSmall}
        onClick={() => {
          setNewImageURL(garden.imageURL || "");
          setEditingImage(true);
        }}
      >
        ערוך תמונה
      </button>
    </>
  )}

  {editingImage && (
    <div className={styles.editDayWrapper}>
      <input
        type="text"
        className={styles.input}
        placeholder="הדבק URL של תמונה"
        value={newImageURL}
        onChange={(e) => setNewImageURL(e.target.value)}
      />

      <button className={styles.saveNoteButton} onClick={handleUpdateImage}>
        שמור
      </button>

      <button
        className={styles.deleteButtonSmall}
        style={{ marginLeft: 8 }}
        onClick={() => setEditingImage(false)}
      >
        ביטול
      </button>
    </div>
  )}
  

</div>
<div className={styles.section} style={{ marginTop: 40 }}>
  <button
    className={styles.deleteGardenButton}
    onClick={handleDeleteGarden}
  >
    🗑️ מחק גינה
  </button>
</div>
    </div>
  );
}

export default GardenDetail;
