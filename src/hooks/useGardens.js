import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";

export function useGardens() {
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    try {
      // Query gardens ordered by name for better performance with larger datasets
      // Limit to 1000 initially - adjust if needed
      const gardensQuery = query(
        collection(db, "gardens"),
        orderBy("name", "asc"),
        limit(1000)
      );

      const unsub = onSnapshot(
        gardensQuery,
        (snap) => {
          setGardens(
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching gardens:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Error setting up gardens listener:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { gardens, loading, error };
}
