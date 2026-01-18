import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config.js";
import styles from "./NewGarden.module.css";
import { getCoordinates } from "../../utils/getCoordinates.js";
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileSizeInfo, setFileSizeInfo] = useState("");
  const [outDays, setOutDays] = useState("");
  const [loading, setLoading] = useState(false);

  // Compress image using Canvas API
  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas and resize
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (maintain aspect ratio)
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/webp",
            0.8 // 80% quality
          );
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("אנא בחר קובץ תמונה");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("גודל התמונה חייב להיות קטן מ-5MB");
      return;
    }

    // Compress image
    compressImage(file).then((compressedFile) => {
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const savings = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
      
      setFileSizeInfo(`הקובץ המקורי: ${originalSize}MB → דחוס: ${compressedSize}MB (חסכון: ${savings}%)`);
      setImageFile(compressedFile);
      
      // Create preview from compressed image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result || "");
      };
      reader.readAsDataURL(compressedFile);
    });
  }

  async function uploadImage(gardenId) {
    if (!imageFile) return null;

    try {
      const storageRef = ref(storage, `gardens/${gardenId}/${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      alert("חייב להתחבר קודם");
      setLoading(false);
      return;
    }

    // Fetch coordinates from address
    const coords = await getCoordinates(address);
    if (!coords) {
      alert("לא ניתן למצוא את המיקום של הכתובת שהזנת");
      setLoading(false);
      return;
    }

    const encodedAddress = encodeURIComponent(address);

    const newGarden = {
      name,
      address,
      day,
      outDays,
      imageURL: "", // Will be updated after upload
      locationURL: `https://waze.com/ul?q=${encodedAddress}`,
      lat: coords.lat,
      lng: coords.lng,
      lastVisit: null,
      notes: [],
      visitLogs: [],
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add garden to Firestore first to get ID
      const docRef = await addDoc(collection(db, "gardens"), newGarden);
      
      // Upload image if selected
      if (imageFile) {
        const imageURL = await uploadImage(docRef.id);
        
        // Update garden document with image URL
        const { updateDoc, doc } = await import("firebase/firestore");
        await updateDoc(doc(db, "gardens", docRef.id), {
          imageURL: imageURL,
        });
      }

      alert("הגן נוסף בהצלחה!");
      window.location.href = "/";
    } catch (error) {
      console.error("Error adding garden:", error);
      alert("שגיאה בהוספת הגן. בדוק את הקונסול לפרטים.");
      setLoading(false);
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
            disabled={loading}
          />

          <label>כתובת</label>
          <input
            className={styles.input}
            value={address}
            required
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />

          <label>יום טיפול</label>
          <select
            className={styles.input}
            value={day}
            required
            onChange={(e) => setDay(e.target.value)}
            disabled={loading}
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
            disabled={loading}
          />

          <label>תמונת הגינה</label>
          <input
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={loading}
          />
          
          {fileSizeInfo && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px", marginBottom: "8px" }}>
              📊 {fileSizeInfo}
            </div>
          )}
          
          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                className={styles.imagePreview}
              />
            </div>
          )}

          <button 
            className={styles.button} 
            type="submit"
            disabled={loading}
          >
            {loading ? "שומר..." : "שמור גן"}
          </button>
        </form>
      </div>
    </div>
  );
}
