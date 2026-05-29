import { useEffect, useRef, useState } from 'react';
import { LogOut, RefreshCw, Sparkles, Trash2, User, UserCheck } from 'lucide-react';
import AuthModal from './AuthModal';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { supabase } from '../utils/supabaseClient';

const SHOW_DEV_UTILITIES = import.meta.env.DEV;

export default function AccountMenu({ onDataReset }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentUser = useWorkoutStore(state => state.currentUser);
  const isSyncing = useWorkoutStore(state => state.isSyncing);
  const fetchUserData = useWorkoutStore(state => state.fetchUserData);
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleGenerateDummyData = () => {
    generateDummyData();
    onDataReset?.();
  };

  const handleClearAllData = () => {
    clearAllData();
    onDataReset?.();
  };

  return (
    <div ref={dropdownRef} className="account-menu-container">
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className={`account-menu-trigger ${currentUser.isGuest ? 'is-guest' : 'is-user'}`}
      >
        <User size={13} />
        {currentUser.isGuest ? '로컬 게스트 모드' : `${currentUser.name} 님`}
      </button>

      {isProfileDropdownOpen && (
        <div className="account-menu-dropdown">
          <div className="account-menu-info">
            {currentUser.isGuest ? (
              '로그인 후 데이터를 동기화하세요'
            ) : (
              <div style={{ wordBreak: 'break-all' }}>
                연동 계정:<br />
                <span className="account-menu-email">{currentUser.email}</span>
              </div>
            )}
          </div>

          <div className="dropdown-divider" />

          {currentUser.isGuest ? (
            <button
              className="dropdown-item"
              onClick={() => {
                setIsProfileDropdownOpen(false);
                setIsAuthModalOpen(true);
              }}
              style={{ color: 'var(--accent)' }}
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
                <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                {isSyncing ? '동기화 중...' : '데이터 수동 동기화'}
              </button>

              <button
                className="dropdown-item"
                style={{ color: '#f7768e' }}
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

          {SHOW_DEV_UTILITIES && (
            <>
              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                onClick={() => {
                  handleGenerateDummyData();
                  setIsProfileDropdownOpen(false);
                }}
              >
                <Sparkles size={14} />
                더미 데이터 생성
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  handleClearAllData();
                  setIsProfileDropdownOpen(false);
                }}
              >
                <Trash2 size={14} />
                초기화
              </button>
            </>
          )}
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
