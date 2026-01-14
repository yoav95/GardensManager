import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import styles from "./ShoppingListView.module.css";
import { FaArrowRight } from "react-icons/fa"; // using react-icons for swipe icon


export default function ShoppingListItem({ item }) {
  if (!item) return null; // guard

  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const threshold = 100; // swipe distance to trigger delete
  // compute red intensity based on swipe distance
  const redIntensity = Math.min(Math.abs(translateX) / threshold, 1);
  const premiumRed = `rgba(200, 50, 50, ${redIntensity * 0.6})`; // softer red

  const handlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (deltaX > 0) { // swipe right only
        setTranslateX(deltaX);
        setSwiping(true);
      }
    },
    onSwipedRight: ({ deltaX }) => {
      setSwiping(false);
      setTranslateX(0);
      if (deltaX > threshold) {
        handleDelete();
      }
    },
    onSwipedLeft: () => {
      setSwiping(false);
      setTranslateX(0);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`למחוק את "${item.title}"?`);
    if (!confirmDelete) return;

    const docRef = doc(db, "shopping", item.id);
    await deleteDoc(docRef);
  };

  return (
    <li className={styles.swipeWrapper} {...handlers}>
      <div
        className={styles.itemContent}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
          backgroundColor: translateX > 0 ? premiumRed : undefined,
          color: translateX > threshold / 2 ? "white" : undefined,
        }}
      >
        <span className={styles.itemName}>{item.title}</span>
        {item.qty != null && <span className={styles.itemQuantity}>x{item.qty}</span>}
        {item.date && (
          <span className={styles.itemDate}>
            {item.date.toDate?.().toLocaleDateString("en-GB")}
          </span>
        )}
      </div>
       
    </li>
  );
}
