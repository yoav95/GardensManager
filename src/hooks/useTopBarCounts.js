// src/hooks/useTopBarCounts.js
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export default function useTopBarCounts() {
  const [gardenCount, setGardenCount] = useState(0);
  const [unfinishedTasks, setUnfinishedTasks] = useState(0);
  const [unresolvedIssues, setUnresolvedIssues] = useState(0);
    const [shoppingCount, setShoppingCount] = useState(0); 

  useEffect(() => {
    // 🧠 Tasks listener
    const unsubTasks = onSnapshot(collection(db, "tasks"), snapshot => {
      const count = snapshot.docs.filter(d => !d.data().done).length;
      setUnfinishedTasks(count);
    });

    // 🌱 Gardens listener
    const unsubGardens = onSnapshot(collection(db, "gardens"), snapshot => {
      setGardenCount(snapshot.size);

      const issuesCount = snapshot.docs.reduce((sum, doc) => {
        const issues = doc.data().requiresAttention || [];
        return sum + issues.filter(issue => !issue.resolved).length;
      }, 0);

      setUnresolvedIssues(issuesCount);
    });

    const unsubShopping = onSnapshot(collection(db, "shopping"), snapshot => {
      setShoppingCount(snapshot.size);
    });

    return () => {
      unsubTasks();
      unsubGardens();
      unsubShopping();
    };
  }, []);

  return {
    gardenCount,
    unfinishedTasks,
    unresolvedIssues,
    totalBadgeCount: unfinishedTasks + unresolvedIssues,
    shoppingCount
  };
}
