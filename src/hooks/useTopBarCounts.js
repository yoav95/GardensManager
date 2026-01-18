// src/hooks/useTopBarCounts.js
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export default function useTopBarCounts() {
  const { user } = useAuth();
  const [gardenCount, setGardenCount] = useState(0);
  const [unfinishedTasks, setUnfinishedTasks] = useState(0);
  const [unresolvedIssues, setUnresolvedIssues] = useState(0);
  const [shoppingCount, setShoppingCount] = useState(0); 

  useEffect(() => {
    if (!user) {
      setGardenCount(0);
      setUnfinishedTasks(0);
      setUnresolvedIssues(0);
      setShoppingCount(0);
      return;
    }

    // 🧠 Tasks listener - filter by userId
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );
    const unsubTasks = onSnapshot(tasksQuery, snapshot => {
      const count = snapshot.docs.filter(d => !d.data().done).length;
      setUnfinishedTasks(count);
    });

    // 🌱 Gardens listener - filter by userId
    const gardensQuery = query(
      collection(db, "gardens"),
      where("userId", "==", user.uid)
    );
    const unsubGardens = onSnapshot(gardensQuery, snapshot => {
      setGardenCount(snapshot.size);

      const issuesCount = snapshot.docs.reduce((sum, doc) => {
        const issues = doc.data().requiresAttention || [];
        return sum + issues.filter(issue => !issue.resolved).length;
      }, 0);

      setUnresolvedIssues(issuesCount);
    });

    // 🛒 Shopping listener - filter by userId
    const shoppingQuery = query(
      collection(db, "shopping"),
      where("userId", "==", user.uid)
    );
    const unsubShopping = onSnapshot(shoppingQuery, snapshot => {
      setShoppingCount(snapshot.size);
    });

    return () => {
      unsubTasks();
      unsubGardens();
      unsubShopping();
    };
  }, [user]);

  return {
    gardenCount,
    unfinishedTasks,
    unresolvedIssues,
    totalBadgeCount: unfinishedTasks + unresolvedIssues,
    shoppingCount
  };
}
