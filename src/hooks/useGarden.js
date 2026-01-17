import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function useGarden(gardenId) {
  const { user } = useAuth();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gardenId || !user) {
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
            const data = { id: docSnap.id, ...docSnap.data() };
            // Verify this garden belongs to the current user
            if (data.userId === user.uid) {
              setGarden(data);
              setError(null);
            } else {
              setGarden(null);
              setError("Access denied");
            }
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
  }, [gardenId, user]);

  return { garden, loading, error };
}
