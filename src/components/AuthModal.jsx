import { useState } from 'react';
import { Mail, Lock, User, X, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useWorkoutStore } from '../store/useWorkoutStore';

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const setAuthSession = useWorkoutStore(state => state.setAuthSession);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setNickname('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (isSignUp && !nickname) {
      setErrorMsg('이름(닉네임)을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
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
          setSuccessMsg('회원가입 및 로그인이 완료되었습니다!');
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setSuccessMsg('회원가입이 완료되었습니다! 이메일 인증 링크를 확인해주세요.');
          setTimeout(() => {
            setIsSignUp(false);
            setSuccessMsg('');
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
        setSuccessMsg('성공적으로 로그인되었습니다!');
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      // Friendly Korean error translations
      let message = err.message || '인증 오류가 발생했습니다.';
      if (message.includes('Invalid login credentials')) {
        message = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (message.includes('User already registered')) {
        message = '이미 등록된 이메일 주소입니다.';
      } else if (message.includes('Password should be at least')) {
        message = '비밀번호는 최소 6자 이상이어야 합니다.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 12, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={handleClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .auth-modal-content {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .auth-input:focus-within {
          border-color: var(--accent) !important;
          box-shadow: 0 0 10px rgba(122, 162, 247, 0.15) !important;
        }
      `}</style>

      <div
        className="auth-modal-content"
        style={{
          width: '380px',
          background: 'rgba(18, 22, 36, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.1) inset',
          padding: '32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            {isSignUp ? 'GridSet 가입하기' : 'GridSet 로그인'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {isSignUp ? '워크아웃 데이터를 안전하게 클라우드에 백업하세요' : '로그인하여 운동 일지를 연동하세요'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            background: 'rgba(247, 118, 142, 0.08)',
            border: '1px solid rgba(247, 118, 142, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f7768e',
            fontSize: '13px',
            marginBottom: '16px',
            lineHeight: '1.4',
            letterSpacing: '-0.01em'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(158, 206, 106, 0.08)',
            border: '1px solid rgba(158, 206, 106, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#9ece6a',
            fontSize: '13px',
            marginBottom: '16px',
            lineHeight: '1.4',
            letterSpacing: '-0.01em'
          }}>
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isSignUp && (
            <div
              className="auth-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                gap: '10px',
                transition: 'all 0.2s',
              }}
            >
              <User size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="이름 (닉네임)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          )}

          <div
            className="auth-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <Mail size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          <div
            className="auth-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              color: 'rgba(12, 14, 24, 1)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(122, 162, 247, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.filter = 'none';
              }
            }}
          >
            {loading ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              isSignUp ? '계정 만들기' : '로그인하기'
            )}
          </button>
        </form>

        {/* Bottom Toggle */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isSignUp ? '이미 계정이 있으신가요?' : '처음이신가요?'}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: '6px',
              padding: '2px 4px',
              fontSize: '13px',
            }}
          >
            {isSignUp ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}
