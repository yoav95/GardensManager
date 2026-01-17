import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function useGardens() {
  const { user } = useAuth();
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setGardens([]);
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // Query gardens filtered by userId only (no orderBy to avoid composite index requirement)
      const gardensQuery = query(
        collection(db, "gardens"),
        where("userId", "==", user.uid)
      );

      const unsub = onSnapshot(
        gardensQuery,
        (snap) => {
          const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by name client-side
          docs.sort((a, b) => a.name.localeCompare(b.name));
          setGardens(docs);
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
  }, [user]);

  return { gardens, loading, error };
}
