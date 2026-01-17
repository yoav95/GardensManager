import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";

export function useGarden(gardenId) {
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gardenId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "gardens", gardenId);
      const unsub = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setGarden({ id: docSnap.id, ...docSnap.data() });
            setError(null);
          } else {
            setGarden(null);
            setError("Garden not found");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching garden:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Error setting up listener:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [gardenId]);

  return { garden, loading, error };
}
