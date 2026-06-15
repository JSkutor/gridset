import { Dumbbell, ListChecks, History } from "lucide-react";
import { APP_NAV_TAB } from "../constants/appNavTabs";
import { startViewTransition } from "../hooks/useViewTransition";

export default function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tabId: string) => void }) {
  const tabs = [
    { id: APP_NAV_TAB.ROUTINE, label: "Routine", shortcut: "Q", icon: <ListChecks size={16} /> },
    { id: APP_NAV_TAB.SET, label: "Set", shortcut: "W", icon: <Dumbbell size={16} /> },
    { id: APP_NAV_TAB.LOG, label: "Log", shortcut: "E", icon: <History size={16} /> },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return;

    const currentIdx = tabs.findIndex((t) => t.id === activeTab);
    const targetIdx = tabs.findIndex((t) => t.id === tabId);
    const direction = targetIdx > currentIdx ? "forward" : "backward";

    startViewTransition(() => setActiveTab(tabId), direction);
  };

  return (
    <div className="app-nav-shell">
      <nav
        data-tab-navigation="main"
        className="app-nav"
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
              className={`app-nav-tab ${isActive ? "is-active" : ""}`}
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
