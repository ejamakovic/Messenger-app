import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css"; 

export default function ThemeToggle() {
  // Check localStorage or fallback to dark as system default
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-theme");
      return saved ? saved === "dark" : true; // Change to false if you want default light
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("app-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      localStorage.setItem("app-theme", "light");
    }
  }, [isDark]);

  return (
    <button
      type="button"
      className={styles.themeToggleBtn}
      onClick={() => setIsDark(!isDark)}
      title={isDark ? "Switch to Bright Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}