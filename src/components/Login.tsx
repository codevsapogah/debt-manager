import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import GooeyCircleLoader from './GooeyCircleLoader';

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

  const loaderProps = {
    loading: true,
    size: 30,
    duration: 1.5,
    colors: ['#fff', '#fff', '#fff']
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{t('app.title')}</h1>
          <p>{t('app.tagline')}</p>
        </div>

        <div className="login-content">
          <h2>{t('auth.welcome')}</h2>
          <p>{t('auth.signInDescription')}</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <GooeyCircleLoader {...loaderProps} />
                <span>{t('auth.signingIn')}</span>
              </div>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.continueWithGoogle')}
              </>
            )}
          </button>
          
          <div className="login-benefits">
            <h3>{t('auth.benefits.title')}</h3>
            <ul>
              <li>{t('auth.benefits.sync')}</li>
              <li>{t('auth.benefits.backup')}</li>
              <li>{t('auth.benefits.access')}</li>
              <li>{t('auth.benefits.safety')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;