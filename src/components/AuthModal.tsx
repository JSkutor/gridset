import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, Lock, User, X, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useWorkoutStore } from "../store/useWorkoutStore";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const setAuthSession = useWorkoutStore((state) => state.setAuthSession);
  const currentUser = useWorkoutStore((state) => state.currentUser);
  const hasClearedDemoData = useWorkoutStore(
    (state) => state.hasClearedDemoData,
  );
  const routines = useWorkoutStore((state) => state.routines);
  const workoutLogs = useWorkoutStore((state) => state.workoutLogs);
  const discardGuestLocalDataForSignUp = useWorkoutStore(
    (state) => state.discardGuestLocalDataForSignUp,
  );

  const shouldDiscardGuestDataForSignUp =
    currentUser.isGuest &&
    !hasClearedDemoData &&
    (routines.length > 0 || workoutLogs.length > 0);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setEmail("");
    setPassword("");
    setNickname("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (isSignUp && !nickname) {
      setErrorMsg("이름(닉네임)을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (shouldDiscardGuestDataForSignUp) {
          discardGuestLocalDataForSignUp();
        }

        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: nickname,
            },
          },
        });

        if (error) throw error;

        // Supabase sometimes requires email verification depending on settings.
        // If data.session is null, it means verification email was sent.
        if (data.session) {
          await setAuthSession(data.session);
          setSuccessMsg("회원가입 및 로그인이 완료되었습니다!");
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setSuccessMsg(
            "회원가입이 완료되었습니다! 이메일 인증 링크를 확인해주세요.",
          );
          setTimeout(() => {
            setIsSignUp(false);
            setSuccessMsg("");
            setLoading(false);
          }, 3000);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await setAuthSession(data.session);
        setSuccessMsg("성공적으로 로그인되었습니다!");
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Friendly Korean error translations
      let message = err.message || "인증 오류가 발생했습니다.";
      if (message.includes("Invalid login credentials")) {
        message = "이메일 또는 비밀번호가 일치하지 않습니다.";
      } else if (message.includes("User already registered")) {
        message = "이미 등록된 이메일 주소입니다.";
      } else if (message.includes("Password should be at least")) {
        message = "비밀번호는 최소 6자 이상이어야 합니다.";
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button onClick={handleClose} className="auth-modal-close">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="auth-modal-header">
          <h2>{isSignUp ? "GridSet 가입하기" : "GridSet 로그인"}</h2>
          <p>
            {isSignUp
              ? "워크아웃 데이터를 안전하게 클라우드에 백업하세요"
              : "로그인하여 운동 일지를 연동하세요"}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && <div className="auth-feedback-msg error">{errorMsg}</div>}

        {successMsg && (
          <div className="auth-feedback-msg success">{successMsg}</div>
        )}

        {isSignUp && shouldDiscardGuestDataForSignUp && (
          <div className="auth-feedback-msg warning">
            회원가입하면 현재 게스트 로컬 데이터는 삭제되고, 빈 계정에서 새로
            시작합니다. 샘플 데이터를 삭제한 뒤 만든 기록만 계정으로 가져옵니다.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="auth-input">
              <User size={16} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="이름 (닉네임)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                disabled={loading}
                className="auth-input-field"
              />
            </div>
          )}

          <div className="auth-input">
            <Mail size={16} style={{ color: "var(--text-muted)" }} />
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={100}
              disabled={loading}
              className="auth-input-field"
            />
          </div>

          <div className="auth-input">
            <Lock size={16} style={{ color: "var(--text-muted)" }} />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={100}
              disabled={loading}
              className="auth-input-field"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : isSignUp ? (
              "계정 만들기"
            ) : (
              "로그인하기"
            )}
          </button>
        </form>

        {/* Bottom Toggle */}
        <div className="auth-footer-toggle">
          {isSignUp ? "이미 계정이 있으신가요?" : "처음이신가요?"}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            disabled={loading}
            className="auth-toggle-link"
          >
            {isSignUp ? "로그인" : "회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
}
