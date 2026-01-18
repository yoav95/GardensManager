import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

const GardensContext = createContext();

export function GardensProvider({ children }) {
  const { user } = useAuth();
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setGardens([]);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
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

  return (
    <GardensContext.Provider value={{ gardens, loading, error }}>
      {children}
    </GardensContext.Provider>
  );
}

export function useGardensContext() {
  const context = useContext(GardensContext);
  if (!context) {
    throw new Error("useGardensContext must be used within GardensProvider");
  }
  return context;
}
