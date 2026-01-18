import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useWorkspace } from "../context/WorkspaceContext";

export function useGarden(gardenId) {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gardenId || !user || !selectedWorkspace) {
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
            // Verify this garden belongs to the current workspace
            if (data.workspaceId === selectedWorkspace) {
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
  }, [gardenId, user, selectedWorkspace]);

  return { garden, loading, error };
}
