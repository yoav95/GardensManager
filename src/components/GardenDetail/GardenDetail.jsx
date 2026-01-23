import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateDoc, arrayUnion, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useGarden } from "../../hooks/useGarden.js";
import styles from "./GardenDetail.module.css";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner.jsx";

function GardenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { garden, loading, error } = useGarden(id);

  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  const [addingVisit, setAddingVisit] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [tasksDone, setTasksDone] = useState(""); 
  const [nextTasks, setNextTasks] = useState("");
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [editingDay, setEditingDay] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [editingOutDays, setEditingOutDays] = useState(false);
  const [newOutDays, setNewOutDays] = useState([]);

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

  const handleOutDaysChange = (dayName) => {
    setNewOutDays((prev) =>
      prev.includes(dayName)
        ? prev.filter((d) => d !== dayName)
        : [...prev, dayName]
    );
  };
  const [editingImage, setEditingImage] = useState(false);
  const [newImageURL, setNewImageURL] = useState("");
  const [addingIssue, setAddingIssue] = useState(false);
  const [newIssueText, setNewIssueText] = useState("");

  const daysHebrew = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
  };


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

async function handleAddIssue() {
  console.log("handleAddIssue called", { newIssueText });
  
  if (!newIssueText.trim()) {
    console.log("Issue text is empty");
    return;
  }

  const newIssue = {
    id: crypto.randomUUID(),
    gardenId: id,
    gardenName: garden.name,
    text: newIssueText,
    createdAt: Timestamp.now(),
    resolved: false,
  };

  console.log("Attempting to add issue:", newIssue);
  const docRef = doc(db, "gardens", id);

  try {
    await updateDoc(docRef, {
      requiresAttention: arrayUnion(newIssue),
    });
    console.log("Issue added successfully");
    setNewIssueText("");
    setAddingIssue(false); // Close the form after saving
  } catch (error) {
    console.error("Error adding issue:", error);
    alert("שגיאה בהוספת תקלה: " + error.message);
  }
}




async function handleDeleteIssue(issueId) { // eslint-disable-line no-unused-vars
  const updatedIssues = (garden.requiresAttention || []).filter(
    issue => issue.id !== issueId
  );

  const docRef = doc(db, "gardens", id);
  try {
    await updateDoc(docRef, { requiresAttention: updatedIssues });
  } catch (error) {
    console.error("Error deleting issue:", error);
  }
}


async function toggleIssueResolved(issueId) {
  const updatedIssues = (garden.requiresAttention || []).map(issue =>
    issue.id === issueId
      ? { ...issue, resolved: !issue.resolved }
      : issue
  );

  const docRef = doc(db, "gardens", id);
  try {
    await updateDoc(docRef, { requiresAttention: updatedIssues });
  } catch (error) {
    console.error("Error updating issue:", error);
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

  try {
    await updateDoc(docRef, { notes: updatedNotes });
    setNewNote("");
    setAddingNote(false);
  } catch (error) {
    console.error("Error adding note:", error);
  }
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

  try {
    await updateDoc(docRef, { imageURL: newImageURL });
    setEditingImage(false);
  } catch (error) {
    console.error("Error updating image:", error);
  }
}



  async function handleDeleteNote(index) {
    const docRef = doc(db, "gardens", id);
    const updatedNotes = garden.notes.filter((_, i) => i !== index);
    try {
      await updateDoc(docRef, { notes: updatedNotes });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }


async function handleAddVisit() {
  if (!tasksDone.trim() && !nextTasks.trim()) return;

  const docRef = doc(db, "gardens", id);

  const newLog = {
    date: visitDate,
    tasks: tasksDone.split("\n").filter(t => t.trim()),
    nextVisitTasks: nextTasks.split("\n").filter(t => t.trim()),
    createdAt: Timestamp.now(),
  };

  try {
    await updateDoc(docRef, {
      visitLogs: arrayUnion(newLog),
      lastVisit: visitDate,
    });
    setTasksDone("");
    setNextTasks("");
    setAddingVisit(false);
  } catch (error) {
    console.error("Error adding visit:", error);
  }
}
async function handleUpdateDay() {
  if (!newDay) return;

  const docRef = doc(db, "gardens", id);

  try {
    await updateDoc(docRef, { day: newDay });
    setEditingDay(false);
  } catch (error) {
    console.error("Error updating day:", error);
  }
}
async function handleUpdateOutDays() {
  const docRef = doc(db, "gardens", id);

  try {
    await updateDoc(docRef, { outDays: newOutDays });
    setEditingOutDays(false);
  } catch (error) {
    console.error("Error updating out days:", error);
  }
}



  async function handleDeleteVisit(index) { // eslint-disable-line no-unused-vars
    const docRef = doc(db, "gardens", id);
    const updatedLogs = garden.visitLogs.filter((_, i) => i !== index);
    try {
      await updateDoc(docRef, { visitLogs: updatedLogs });
    } catch (error) {
      console.error("Error deleting visit:", error);
    }
  }

  // Loading state - prioritize this to avoid showing "not found" while loading
  if (loading) {
    return (
      <div className={styles.container} style={{ direction: "rtl" }}>
        <LoadingSpinner message="טוען פרטי הגן..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container} style={{ direction: "rtl" }}>
        <p style={{ color: "red", textAlign: "center" }}>
          שגיאה בטעינת הגן: {error}
        </p>
        <button
          className={styles.backButton}
          onClick={() => navigate("/")}
          style={{ margin: "20px auto", display: "block" }}
        >
          חזור לעמוד הבית
        </button>
      </div>
    );
  }

  // Guard: ensure garden exists before rendering
  if (!garden) {
    return (
      <div className={styles.container} style={{ direction: "rtl" }}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>טוען פרטי הגן...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ direction: "rtl" }}>
      {/* Hero Image Section with Title Overlay (Mobile Only) */}
      <div className={styles.heroSection}>
        {garden.imageURL ? (
          <img src={garden.imageURL} alt={garden.name} className={styles.heroImage} />
        ) : (
          <div className={styles.heroPlaceholder}>
            <span>🌿</span>
          </div>
        )}
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>{garden.name}</h1>
        </div>
        <button
          className={styles.backButton}
          onClick={() => navigate("/")}
        >
          ← חזור
        </button>
      </div>

      <div className={styles.contentWrapper}>
        {/* Desktop Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className={styles.title}>{garden.name}</h1>
          <button
            className={styles.backButton}
            onClick={() => navigate("/")}
            style={{ position: "static" }}
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
      X
    </button>
  </div>
)}

       <div className={styles.sectionRow}>
  <p>
    <strong>ימי הוצאה:</strong> {Array.isArray(garden.outDays) && garden.outDays.length > 0 ? garden.outDays.map(d => daysHebrew[d]).join(", ") : "לא צויין"}
  </p>

  {!editingOutDays && (
    <button
      className={styles.buttonSmall}
      onClick={() => {
        setNewOutDays(Array.isArray(garden.outDays) ? garden.outDays : []);
        setEditingOutDays(true);
      }}
    >
      ערוך
    </button>
  )}
</div>

{editingOutDays && (
  <div className={styles.editDayWrapper}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px", marginBottom: "12px" }}>
      {days.map((d) => (
        <label key={d} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", backgroundColor: newOutDays.includes(d) ? "#e0f2f1" : "#fff" }}>
          <input
            type="checkbox"
            checked={newOutDays.includes(d)}
            onChange={() => handleOutDaysChange(d)}
            style={{ cursor: "pointer", accentColor: "#4caf50" }}
          />
          <span style={{ fontSize: "14px", fontWeight: "500" }}>{daysHebrew[d]}</span>
        </label>
      ))}
    </div>

    <button className={styles.saveNoteButton} onClick={handleUpdateOutDays}>
      שמור
    </button>

    <button
      className={styles.deleteButtonSmall}
      style={{ marginLeft: 8 }}
      onClick={() => setEditingOutDays(false)}
    >
      X
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
      {/* Requires Attention Section */}
{/* Requires Attention Section */}
<div className={styles.issuesSection}>
  <div className={styles.issuesHeader}>
    ⚠️ דורש טיפול
  </div>

  {garden.requiresAttention?.length > 0 ? (
    <div className={styles.issuesList}>
      {garden.requiresAttention.map((issue) => (
        <div
          key={issue.id}
          className={styles.issueCard}
          style={{
            textDecoration: issue.resolved ? "line-through" : "none",
            opacity: issue.resolved ? 0.6 : 1,
          }}
        >
          <div className={styles.issueContent}>
            <div className={styles.issueText}>
              <span>{issue.text}</span>
              <small>
                נוצר בתאריך: {formatDate(issue.createdAt?.toDate?.() || issue.createdAt)}
              </small>
            </div>

            <div className={styles.issueActions}>
              <button
                className={styles.resolveButton}
                onClick={() => toggleIssueResolved(issue.id)}
              >
                {issue.resolved ? "לא טופל" : "טופל"}
              </button>

              {/* <button
                className={styles.deleteButton}
                onClick={() => handleDeleteIssue(issue.id)}
              >
                ✕
              </button> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className={styles.noIssues}>אין תקלות פתוחות.</p>
  )}

  {addingIssue && (
    <div className={styles.addIssueWrapper}>
      <input
        type="text"
        className={styles.addIssueInput}
        placeholder="לדוגמה: ממטרה שבורה"
        value={newIssueText}
        onChange={(e) => setNewIssueText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIssue();
          }
        }}
        autoFocus
      />
      <button 
        className={styles.addIssueButton} 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Save button clicked");
          handleAddIssue();
        }}
        type="button"
      >
        שמור
      </button>
    </div>
  )}

  <button
    className={styles.toggleAddIssueButton}
    onClick={() => setAddingIssue(!addingIssue)}
  >
    + הוסף תקלה
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
      {/* <button
        className={styles.deleteButtonSmall}
        onClick={(e) => { e.stopPropagation(); handleDeleteVisit(idx); }}
      >
        ✕
      </button> */}
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

<div style={{ marginTop: 40, marginBottom: 20 }}>
  <button
    className={styles.deleteGardenButton}
    onClick={handleDeleteGarden}
  >
    🗑️ מחק גינה
  </button>
</div>
      </div>
    </div>
  );
}

export default GardenDetail;
