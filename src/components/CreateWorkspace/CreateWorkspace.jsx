import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./CreateWorkspace.module.css";

function CreateWorkspace({ onWorkspaceCreated }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create workspace with owner as first member
      const workspaceData = {
        name: formData.name,
        description: formData.description,
        owner: user.email,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        members: {
          [user.uid]: {
            role: "admin",
            email: user.email,
            displayName: user.displayName || user.email,
            joinedAt: new Date().toISOString()
          }
        }
      };

      const docRef = await addDoc(collection(db, "workspaces"), workspaceData);
      
      alert(`סביבת עבודה "${formData.name}" נוצרה בהצלחה!`);
      setFormData({ name: "", description: "" });
      setShowForm(false);
      
      if (onWorkspaceCreated) {
        onWorkspaceCreated(docRef.id);
      }
    } catch (error) {
      console.error("Error creating workspace:", error);
      alert("שגיאה ביצירת סביבת עבודה: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={styles.createButton}
        >
          ➕ צור סביבת עבודה חדשה
        </button>
      ) : (
        <div className={styles.formCard}>
          <h3>סביבת עבודה חדשה</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">שם סביבת העבודה *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="לדוגמה: החברה שלי, לקוח ABC"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">תיאור (אופציונלי)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="תיאור קצר של סביבת העבודה"
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className={styles.submitButton}
              >
                {loading ? "יוצר..." : "צור סביבת עבודה"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: "", description: "" });
                }}
                className={styles.cancelButton}
                disabled={loading}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CreateWorkspace;
