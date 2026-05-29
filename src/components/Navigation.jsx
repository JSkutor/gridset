import { Dumbbell, ListChecks, History } from "lucide-react";
import { startViewTransition } from "../hooks/useViewTransition";

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "R", label: "Routine", shortcut: "Q", icon: <ListChecks size={16} /> },
    { id: "S", label: "Set", shortcut: "W", icon: <Dumbbell size={16} /> },
    { id: "L", label: "Log", shortcut: "E", icon: <History size={16} /> },
  ];

  const handleTabClick = (tabId) => {
    const currentIdx = tabs.findIndex((t) => t.id === activeTab);
    const targetIdx = tabs.findIndex((t) => t.id === tabId);
    const direction = targetIdx > currentIdx ? "forward" : "backward";

    startViewTransition(() => setActiveTab(tabId), direction);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        flexShrink: 0,
      }}
    >
      <nav
        data-tab-navigation="main"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "5px",
          gap: "3px",
          background: "rgba(12, 14, 24, 0.6)",
          backdropFilter: "blur(24px) saturate(1.3)",
          WebkitBackdropFilter: "blur(24px) saturate(1.3)",
          borderRadius: "9999px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--border)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id)}
              title={`${tab.label} (${tab.shortcut})`}
              aria-keyshortcuts={tab.shortcut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 22px",
                borderRadius: "9999px",
                border: "none",
                background: isActive
                  ? "rgba(122, 162, 247, 0.12)"
                  : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: isActive ? "600" : "500",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontSize: "14px",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

