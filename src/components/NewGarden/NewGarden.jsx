import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import styles from "./NewGarden.module.css";
import { getCoordinates } from "../../utils/getCoordinates.js"; // <-- import your function
import { useAuth } from "../../hooks/useAuth.js";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const daysHebrew = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
};

export default function NewGarden() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [outDays, setOutDays] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert("חייב להתחבר קודם");
      return;
    }

    // Fetch coordinates from address
    const coords = await getCoordinates(address);
    if (!coords) {
      alert("לא ניתן למצוא את המיקום של הכתובת שהזנת");
      return;
    }

    const encodedAddress = encodeURIComponent(address);

    const newGarden = {
      name,
      address,
      day,
      outDays,
      imageURL: imageURL || "",
      locationURL: `https://waze.com/ul?q=${encodedAddress}`,
      lat: coords.lat,
      lng: coords.lng,
      lastVisit: null,
      notes: [],
      visitLogs: [],
      userId: user.uid,
    };

    try {
      await addDoc(collection(db, "gardens"), newGarden);
      alert("הגן נוסף בהצלחה!");
      window.location.href = "/";
    } catch (error) {
      console.error("Error adding garden:", error);
      alert("שגיאה בהוספת הגן. בדוק את הקונסול לפרטים.");
    }
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.top}>
        <h1 className={styles.appTitle}>הוסף גינה חדשה</h1>
      <button
  className={styles.backButton}
  onClick={() => (window.location.href = "/")}
>
  ← חזרה
</button>
      </div>
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

          <label>ימי הוצאה</label>
          <input
            className={styles.input}
            value={outDays}
            onChange={(e) => setOutDays(e.target.value)}
            placeholder="לדוגמה: א, ג, ד"
          />

          <button className={styles.button} type="submit">
            שמור גן
          </button>
        </form>
      </div>

      

    </div>
  );
}
