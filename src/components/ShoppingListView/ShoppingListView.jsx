import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useSwipeable } from "react-swipeable";
import styles from "./ShoppingListView.module.css";
import ShoppingListItem from "./ShoppingListItem.jsx";
import { FaArrowRight } from "react-icons/fa"; // using react-icons for swipe icon

export default function ShoppingListView() {
  const [items, setItems] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newQty, setNewQty] = useState(1);

  useEffect(() => {
    const colRef = collection(db, "shopping");
    const unsub = onSnapshot(colRef, snapshot => {
      const allItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(allItems);
    });

    return () => unsub();
  }, []);

  async function addShoppingItem(title, qty) {
    const colRef = collection(db, "shopping");
    await addDoc(colRef, {
      title,
      qty,
      date: Timestamp.now(),
    });
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return;

    await addShoppingItem(newTitle.trim(), newQty);

    setNewTitle("");
    setNewQty(1);
  };

    return (
    <div>
      <div className={styles.addForm}>
        <input
          type="text"
          placeholder="שם פריט"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.input}
        />
        <input
          type="number"
          placeholder="כמות"
          value={newQty}
          onChange={(e) => setNewQty(Number(e.target.value))}
          className={styles.input}
          min={1}
        />
        <button onClick={handleAdd} className={styles.addButton}>
          הוסף
        </button>
      </div>

      {items.length === 0 && <div className={styles.empty}>אין חוסרים ברשימה</div>}

      <ul className={styles.list}>
        {items.map(item => (
          <ShoppingListItem key={item.id} item={item} />
        ))}
      </ul>
      <div className={styles.swipeHint}>
          <FaArrowRight style={{ marginRight: "6px" }} />
          החלק ימינה למחיקה
        </div>
    </div>
  );
}
