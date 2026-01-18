import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, Timestamp, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useSwipeable } from "react-swipeable";
import styles from "./ShoppingListView.module.css";
import ShoppingListItem from "./ShoppingListItem.jsx";
import { FaArrowRight } from "react-icons/fa";

export default function ShoppingListView() {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const [items, setItems] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newQty, setNewQty] = useState(1);

  useEffect(() => {
    if (!user || !selectedWorkspace) {
      setItems([]);
      return;
    }

    const shoppingQuery = query(
      collection(db, "shopping"),
      where("workspaceId", "==", selectedWorkspace)
    );
    const unsub = onSnapshot(shoppingQuery, snapshot => {
      const allItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(allItems);
    });

    return () => unsub();
  }, [user, selectedWorkspace]);

  async function addShoppingItem(title, qty) {
    if (!user || !selectedWorkspace) return;

    const colRef = collection(db, "shopping");
    await addDoc(colRef, {
      title,
      qty,
      date: Timestamp.now(),
      userId: user.uid,
      workspaceId: selectedWorkspace,
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
