import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { CreditCard, TrendingUp, Clock } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Full sign in error:', error);
      let errorMessage = t('auth.errors.default');

      if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = t('auth.errors.unauthorized');
      } else if (error?.code === 'auth/popup-blocked') {
        errorMessage = t('auth.errors.popupBlocked');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = t('auth.errors.popupClosed');
      } else if (error?.message) {
        errorMessage = t('auth.errors.signInError', { message: error.message });
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: CreditCard, text: t('auth.benefits.sync') || 'Sync across all your devices' },
    { icon: TrendingUp, text: t('auth.benefits.backup') || 'Secure cloud backup' },
    { icon: Clock, text: t('auth.benefits.access') || 'Access anywhere, anytime' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #2563EB 100%)',
      padding: 24,
      fontFamily: 'var(--font-family)',
    }}>
      {/* Logo */}
      <div style={{
        fontSize: 42,
        fontWeight: 900,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        marginBottom: 8,
      }}>
        Klaro
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 48,
        textAlign: 'center',
      }}>
        {t('app.tagline')}
      </div>

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          padding: '14px 24px',
          backgroundColor: '#FFFFFF',
          color: '#1A1A2E',
          border: 'none',
          borderRadius: 9999,
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: 'var(--font-family)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        }}
        onMouseOver={e => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.25)';
        }}
      >
        {/* Google Icon SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? t('auth.signingIn') : t('auth.continueWithGoogle')}
      </button>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 16,
          padding: '10px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#FCA5A5',
          borderRadius: 8,
          fontSize: 14,
          maxWidth: 320,
          width: '100%',
          textAlign: 'center',
        }}
        role="alert"
        >
          {error}
        </div>
      )}

      {/* Benefits */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginTop: 48,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {benefits.map(({ icon: Icon, text }, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon size={20} color="rgba(255, 255, 255, 0.8)" />
            </div>
            <span style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: 100,
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Login;
