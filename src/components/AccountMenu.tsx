import { useEffect, useRef, useState } from "react";
import { Download, LogOut, RefreshCw, User, UserCheck } from "lucide-react";
import AuthModal from "./AuthModal";
import { useWorkoutStore } from "../store/useWorkoutStore";
import { supabase } from "../utils/supabaseClient";
import { downloadDataAsCSV } from "../utils/exportData";

export default function AccountMenu() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = useWorkoutStore((state) => state.currentUser);
  const isSyncing = useWorkoutStore((state) => state.isSyncing);
  const fetchUserData = useWorkoutStore((state) => state.fetchUserData);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const state = useWorkoutStore.getState();
      await downloadDataAsCSV({
        routines: state.routines,
        sessions: state.sessions,
        sessionExercises: state.sessionExercises,
        sessionExerciseGroups: state.sessionExerciseGroups,
        exercises: state.exercises,
        workoutLogs: state.workoutLogs,
        setRecords: state.setRecords,
      });
    } catch (error) {
      console.error("데이터 내보내기 실패:", error);
      alert("데이터 내보내기에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <div ref={dropdownRef} className="account-menu-container">
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className={`account-menu-trigger ${currentUser.isGuest ? "is-guest" : "is-user"}`}
      >
        <User size={13} />
        {currentUser.isGuest ? "로컬 게스트 모드" : `${currentUser.name} 님`}
      </button>

      {isProfileDropdownOpen && (
        <div className="account-menu-dropdown">
          <div className="account-menu-info">
            {currentUser.isGuest ? (
              "로그인 후 데이터를 동기화하세요"
            ) : (
              <div style={{ wordBreak: "break-all" }}>
                연동 계정:
                <br />
                <span className="account-menu-email">{currentUser.email}</span>
              </div>
            )}
          </div>

          <div className="dropdown-divider" />

          <button
            className="dropdown-item"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download size={14} />
            {isExporting ? "내보내는 중..." : "데이터 내보내기"}
          </button>

          <div className="dropdown-divider" />

          {currentUser.isGuest ? (
            <button
              className="dropdown-item"
              onClick={() => {
                setIsProfileDropdownOpen(false);
                setIsAuthModalOpen(true);
              }}
              style={{ color: "var(--accent)" }}
            >
              <UserCheck size={14} />
              로그인 / 회원가입
            </button>
          ) : (
            <>
              <button
                className="dropdown-item"
                disabled={isSyncing}
                onClick={async () => {
                  await fetchUserData();
                  setIsProfileDropdownOpen(false);
                }}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: isSyncing ? "spin 1s linear infinite" : "none",
                  }}
                />
                {isSyncing ? "동기화 중..." : "데이터 수동 동기화"}
              </button>

              <button
                className="dropdown-item"
                style={{ color: "#f7768e" }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsProfileDropdownOpen(false);
                }}
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </>
          )}
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
