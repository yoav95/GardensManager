import { useEffect, useState } from "react";
import { useGardens } from "../../hooks/useGardens.js";
import styles from "./ChargesView.module.css";
import { FaArrowRight } from "react-icons/fa";

export default function ChargesView() {
  const { gardens } = useGardens();
  const [chargesByMonth, setChargesByMonth] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  useEffect(() => {
    // Aggregate all charges from all gardens and group by month
    const grouped = {};

    gardens.forEach((garden) => {
      if (garden.charges && Array.isArray(garden.charges)) {
        garden.charges.forEach((charge) => {
          // Extract year and month from date string (YYYY-MM-DD)
          const [year, month] = charge.date.split("-");
          const monthKey = `${year}-${month}`;
          
          if (!grouped[monthKey]) {
            grouped[monthKey] = [];
          }
          
          grouped[monthKey].push({
            ...charge,
            gardenName: garden.name,
            gardenId: garden.id,
          });
        });
      }
    });

    // Sort months in descending order (newest first)
    const sorted = {};
    Object.keys(grouped)
      .sort()
      .reverse()
      .forEach((key) => {
        // Sort charges within each month by date (newest first)
        sorted[key] = grouped[key].sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
      });

    setChargesByMonth(sorted);

    // Auto-expand current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setExpandedMonths({ [currentMonthKey]: true });
  }, [gardens]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  function formatMonthHeader(monthKey) {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, parseInt(month) - 1);
    const monthName = date.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }

  const months = Object.keys(chargesByMonth);
  const totalCharges = months.reduce((sum, month) => sum + chargesByMonth[month].length, 0);

  return (
    <div className={styles.container}>
      {totalCharges === 0 ? (
        <div className={styles.empty}>אין חיובים עדיין</div>
      ) : (
        <div className={styles.chargesContainer}>
          {months.map((monthKey) => (
            <div key={monthKey} className={styles.monthSection}>
              <div 
                className={styles.monthHeader}
                onClick={() => toggleMonth(monthKey)}
                style={{ cursor: "pointer" }}
              >
                <span>
                  {expandedMonths[monthKey] ? "▼" : "▶"} {formatMonthHeader(monthKey)}
                </span>
                <span className={styles.monthCount}>
                  {chargesByMonth[monthKey].length} פריטים
                </span>
              </div>

              {expandedMonths[monthKey] && (
                <div className={styles.chargesList}>
                  {chargesByMonth[monthKey].map((charge) => (
                    <div key={charge.id} className={styles.chargeRow}>
                      <div className={styles.chargeInfo}>
                        <div className={styles.chargeName}>{charge.name}</div>
                        <div className={styles.chargeDetails}>
                          <span className={styles.chargeDate}>{formatDate(charge.date)}</span>
                          <span className={styles.chargeGarden}>{charge.gardenName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={styles.swipeHint}>
        <FaArrowRight style={{ marginRight: "6px" }} />
        סך הכל: {totalCharges} פריטים
      </div>
    </div>
  );
}
