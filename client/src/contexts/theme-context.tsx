import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const { toast } = useToast();

  useEffect(() => {
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Apply theme to the document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      
      // Apply data-theme attribute for components that use it
      document.body.setAttribute('data-theme', systemTheme);
    } else {
      root.classList.add(theme);
      
      // Apply data-theme attribute for components that use it
      document.body.setAttribute('data-theme', theme);
    }

    // Apply theme to all elements that might need it
    const themeColor = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) 
      ? "#1e293b" // dark slate color
      : "#f8fafc"; // light slate color
    
    // Set CSS variables for theme colors
    document.documentElement.style.setProperty('--theme-bg', themeColor);
    
    // Update the theme.json appearance (just visual feedback, actual change will be server-side)
    fetch('/api/update-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearance: theme }),
    }).catch(() => {
      // Silent fail - this is just a nice-to-have
    });

  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Changed to ${newTheme === 'system' ? 'system preference' : newTheme} theme`,
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
