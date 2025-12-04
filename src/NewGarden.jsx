import { useState } from "react";
import { useGardens } from "./hooks/useGardens";
import styles from "./App.module.css";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

export default function NewGarden() {

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [outDays, setOutDays] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

async function handleSubmit(e) {
  e.preventDefault();
const encodedAddress = encodeURIComponent(address);
  const newGarden = {
  name,
  address,
  day,
  outDays,
  imageURL: imageURL || "",
  locationURL: `https://waze.com/ul?q=${encodedAddress}`,
  lastVisit: null,
  notes: [],
  visitLogs: [],
};

  try {
    await addDoc(collection(db, "gardens"), newGarden);
    alert("הגן נוסף בהצלחה!"); // success message
    window.location.href = "/";
  } catch (error) {
    console.error("Error adding garden:", error);
    alert("שגיאה בהוספת הגן. בדוק את הקונסול לפרטים."); // error message
  }
}

  return (
    <div className={styles.appContainer}>
      <h1 className={styles.appTitle}>הוסף גינה חדשה</h1>

      <div className={styles.card} style={{ cursor: "default" }}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>שם הגינה</label>
          <input
            className={styles.input}
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />

          <label>כתובת</label>
          <input
            className={styles.input}
            value={address}
            required
            onChange={(e) => setAddress(e.target.value)}
          />

          <label>יום טיפול</label>
          <select
            className={styles.input}
            value={day}
            required
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="">בחר יום</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {daysHebrew[d]}
              </option>
            ))}
          </select>
          <label>ימי הוצאה </label>
<input
  className={styles.input}
  value={outDays}
  onChange={(e) => setOutDays(e.target.value)}
  placeholder="לדוגמה: א, ג, ד"
/>




          {/* <label>תמונה (URL)</label>
          <input
            className={styles.input}
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
          /> */}

          <button className={styles.button} type="submit">
            שמור גן
          </button>
        </form>
      </div>

      <button
        className={styles.button}
        onClick={() => (window.location.href = "/")}
        style={{ background: "#999", marginTop: "16px" }}
      >
        ← חזרה
      </button>
    </div>
  );
}
