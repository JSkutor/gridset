import { useState } from 'react';
import { HelpCircle, X, Keyboard, ShieldAlert, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';

export default function HelpModal({ isOpen, onClose, onDataReset }) {
  const [pendingAction, setPendingAction] = useState(null); // 'demo' | 'clear' | 'tour' | null
  
  const generateDummyData = useWorkoutStore(state => state.generateDummyData);
  const clearAllData = useWorkoutStore(state => state.clearAllData);

  if (!isOpen) return null;

  const handleActionConfirm = () => {
    if (pendingAction === 'demo') {
      generateDummyData();
      onDataReset?.();
    } else if (pendingAction === 'clear') {
      clearAllData();
      onDataReset?.();
    }
    setPendingAction(null);
    onClose();
  };

  const handleActionCancel = () => {
    setPendingAction(null);
  };

  return (
    <div className="help-backdrop">
      <div className="help-card fade-in">
        {/* Header */}
        <div className="help-header">
          <div className="help-title-wrap">
            <HelpCircle size={20} className="text-accent animate-pulse-subtle" />
            <h2>도움말 및 데이터 관리</h2>
          </div>
          <button className="help-close-btn" onClick={onClose} aria-label="도움말 닫기">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="help-content">
          
          <div className="help-section">
            <div className="section-title-wrap">
              <Keyboard size={15} className="text-accent" />
              <h3>키보드 단축키</h3>
            </div>

            <p className="help-section-desc">
              방향키는 현재 목록이나 셀 안에서 자연스럽게 이동합니다. 단축키가 먹지 않으면 <kbd>Esc</kbd>로 포커스를 해제한 뒤 다시 사용하세요.
            </p>
            
            <div className="help-shortcut-grid">
              <div className="shortcut-card">
                <h4>화면 전환</h4>
                <div className="help-shortcut-row">
                  <span>루틴 편집</span>
                  <kbd>Q</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>실시간 기록</span>
                  <kbd>W</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>로그 확인</span>
                  <kbd>E</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>이전/다음 화면</span>
                  <span className="shortcut-key-combo"><kbd>Cmd/Ctrl</kbd><kbd>←/→</kbd></span>
                </div>
              </div>

              <div className="shortcut-card">
                <h4>공통 이동</h4>
                <div className="help-shortcut-row">
                  <span>목록/셀 이동</span>
                  <span className="shortcut-key-combo"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>다음 포커스</span>
                  <kbd>Tab</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>이전 포커스</span>
                  <span className="shortcut-key-combo"><kbd>Shift</kbd><kbd>Tab</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>포커스 해제 / 복귀</span>
                  <kbd>Esc</kbd>
                </div>
              </div>

              <div className="shortcut-card">
                <h4>기록</h4>
                <div className="help-shortcut-row">
                  <span>그리드 진입 / 메모 전환</span>
                  <span className="shortcut-key-combo"><kbd>`</kbd><kbd>₩</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>아래 세트로 이동</span>
                  <kbd>Enter</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>입력 후 다음 칸</span>
                  <kbd>Tab</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>휴식 타이머</span>
                  <span className="desc-sub"><kbd>Reps</kbd> 후 <kbd>Tab</kbd></span>
                </div>
              </div>

              <div className="shortcut-card">
                <h4>루틴 편집</h4>
                <div className="help-shortcut-row">
                  <span>세션/운동 목록 진입</span>
                  <span className="shortcut-key-combo"><kbd>`</kbd><kbd>₩</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>세션/운동 순서 변경</span>
                  <span className="shortcut-key-combo"><kbd>Cmd/Ctrl</kbd><kbd>↑/↓</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>설정값 변경</span>
                  <span className="shortcut-key-combo"><kbd>Cmd/Ctrl</kbd><kbd>↑/↓</kbd></span>
                </div>
              </div>

              <div className="shortcut-card">
                <h4>운동 검색</h4>
                <div className="help-shortcut-row">
                  <span>선택 / 커스텀 추가</span>
                  <kbd>Enter</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>검색 결과 이동</span>
                  <span className="shortcut-key-combo"><kbd>↑</kbd><kbd>↓</kbd></span>
                </div>
                <div className="help-shortcut-row">
                  <span>검색 취소</span>
                  <kbd>Esc</kbd>
                </div>
              </div>

              <div className="shortcut-card">
                <h4>로그</h4>
                <div className="help-shortcut-row">
                  <span>일일 로그</span>
                  <kbd>A</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>운동별 추이</span>
                  <kbd>S</kbd>
                </div>
                <div className="help-shortcut-row">
                  <span>루틴 로그</span>
                  <kbd>D</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="help-divider" />

          {/* Section 2: Data Management */}
          <div className="help-section">
            <div className="section-title-wrap">
              <ShieldAlert size={15} style={{ color: '#f7768e' }} />
              <h3>데이터 관리 및 초기화</h3>
            </div>
            
            <p className="help-section-desc">
              Gridset의 체험용 데모 데이터를 불러오거나, 보관 중인 모든 데이터를 삭제하여 새로운 운동 기록을 개시할 수 있습니다.
            </p>

            <div className="help-data-buttons">
              <button 
                className="help-action-btn btn-demo"
                onClick={() => setPendingAction('demo')}
              >
                <Sparkles size={14} />
                <span>데모 데이터 로드</span>
              </button>



              <button 
                className="help-action-btn btn-clear"
                onClick={() => setPendingAction('clear')}
              >
                <Trash2 size={14} />
                <span>기록 전체 초기화</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Confirmation Dialog Overlay */}
        {pendingAction && (
          <div className="help-confirm-overlay fade-in">
            <div className="help-confirm-card">
              <AlertTriangle size={36} className="text-warning animate-bounce-subtle" />
              
              <h3>
                {pendingAction === 'demo' && '데모 데이터를 채우시겠습니까?'}
                {pendingAction === 'clear' && '정말로 초기화하시겠습니까?'}
              </h3>
              
              <p>
                {pendingAction === 'demo' && '기존 데이터 위에 4개의 운동 루틴과 50여 개 분량의 더미 로그가 덮어씌워집니다. 체험 및 대시보드 구경 용도로 권장합니다.'}
                {pendingAction === 'clear' && '이 작업은 절대 되돌릴 수 없습니다. 작성하신 모든 루틴 설정, 세트 기록, 날짜별 운동 완료 내역이 영구적으로 삭제됩니다.'}
              </p>

              <div className="help-confirm-buttons">
                <button 
                  className={`confirm-btn ${pendingAction === 'clear' ? 'is-danger' : 'is-primary'}`}
                  onClick={handleActionConfirm}
                >
                  {pendingAction === 'demo' && '네, 채워주세요'}
                  {pendingAction === 'clear' && '예, 완전히 초기화합니다'}
                </button>
                <button 
                  className="confirm-btn is-cancel"
                  onClick={handleActionCancel}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
