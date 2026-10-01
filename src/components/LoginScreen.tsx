import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HARVESTER_LOGO } from '../mockData';

export const LoginScreen: React.FC = () => {
  const { login, loginWithGoogle, sendResetEmail, setupInitialAdmin, hasAnyUsers, checkHasUsers } = useAuth();

  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Check if first-time setup is needed
  React.useEffect(() => {
    checkHasUsers().then((exists) => {
      if (!exists) {
        setIsFirstSetup(true);
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both Email and Password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    try {
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('Email/Password provider is not yet enabled in your Firebase project.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Only accounts created by the Admin can log in.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !email.trim() || !password) {
      setErrorMsg('Please enter your Name, Email, and Password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    try {
      await setupInitialAdmin(adminName, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setErrorMsg('Email/Password provider is not yet enabled in your Firebase project.');
      } else {
        setErrorMsg(err.message || 'Failed to initialize Admin account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Please enter your email.');
      return;
    }
    try {
      await sendResetEmail(forgotEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowForgotModal(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to send password reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xl border border-outline-variant/30 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-secondary-container/60 p-2.5 flex items-center justify-center shadow-xs">
            <img src={HARVESTER_LOGO} alt="Harvester Book Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl font-extrabold text-on-surface">
              Harvester Book
            </h1>
            <p className="font-label-sm text-xs text-on-surface-variant font-semibold tracking-wide">
              {isFirstSetup ? 'Initial Admin Setup' : 'Field Ledger & Machinery Operations'}
            </p>
          </div>
        </div>

        {/* First time setup indicator */}
        {isFirstSetup && (
          <div className="bg-primary-fixed/30 p-3.5 rounded-2xl border border-primary-fixed flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              shield_person
            </span>
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-bold block">First-Time Setup Detected</strong>
              No accounts exist yet. Create your master <strong>Admin Account</strong> below. Once created, only you can add partner and driver logins in Settings.
            </div>
          </div>
        )}

        {/* Error message alert */}
        {errorMsg && (
          <div className="bg-error-container/70 text-on-error-container p-3.5 rounded-xl text-xs font-semibold flex flex-col gap-1.5 border border-error/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
            {isOperationNotAllowed && (
              <div className="mt-1 pt-2 border-t border-error/20 text-on-error-container/90 flex flex-col gap-2 font-normal">
                <span>To use Email + Password sign-in:</span>
                <ol className="list-decimal list-inside space-y-1 font-medium">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.firebase.google.com/project/clean-elevator-k9brs/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-secondary"
                    >
                      Firebase Console &gt; Sign-in method
                    </a>
                  </li>
                  <li>Click <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                </ol>
                <span className="font-semibold text-secondary">
                  💡 Alternatively, use 1-click Google Sign-in below without needing to configure anything!
                </span>
              </div>
            )}
          </div>
        )}

        {/* First Setup Form */}
        {isFirstSetup ? (
          <form onSubmit={handleFirstTimeSetup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-xs font-bold text-on-surface">
                Admin Full Name
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Anand"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-xs font-bold text-on-surface">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anand@example.com"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-xs font-bold text-on-surface">
                Create Master Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-12 pl-3.5 pr-12 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-xs font-bold text-on-surface">
                Confirm Master Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-2 rounded-full bg-secondary text-on-secondary font-label-lg font-bold text-sm shadow-md hover:bg-secondary/95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Setting up Master Admin...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  <span>Create Admin with Email &amp; Password</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-surface-container-highest"></div>
              <span className="text-[11px] text-outline uppercase font-semibold">Or</span>
              <div className="flex-1 h-px bg-surface-container-highest"></div>
            </div>

            {/* Instant Google Setup */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-outline-variant/40"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Setup Master Admin with Google (Instant)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setIsFirstSetup(false);
              }}
              className="text-xs text-secondary font-bold hover:underline text-center py-1 cursor-pointer"
            >
              Already set up? Switch to standard login
            </button>
          </form>
        ) : (
          /* Normal Login Form */
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-xs font-bold text-on-surface">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. anand@harvester.com"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-xs font-bold text-on-surface">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-label-sm text-xs text-secondary font-bold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-3.5 pr-12 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant px-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="accent-secondary w-3.5 h-3.5"
                />
                <span>Show password</span>
              </label>
              <span className="text-[11px] text-outline">
                Auto-logout: 30m idle
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-2 rounded-full bg-secondary text-on-secondary font-label-lg font-bold text-sm shadow-md hover:bg-secondary/95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Login to Harvester Book</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-surface-container-highest"></div>
              <span className="text-[11px] text-outline uppercase font-semibold">Or</span>
              <div className="flex-1 h-px bg-surface-container-highest"></div>
            </div>

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-outline-variant/40"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Note on access */}
            <div className="text-center pt-2 flex flex-col gap-2">
              <span className="text-xs text-outline leading-tight block">
                Private ledger. Accounts are created and managed by the Admin.
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsFirstSetup(true);
                }}
                className="text-xs text-secondary font-bold hover:underline cursor-pointer"
              >
                Owner first-time setup? Create Master Admin Account
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-on-surface">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Enter your email address and we'll send you a password reset link.
            </p>

            {resetSuccess ? (
              <div className="bg-secondary-container/60 text-on-secondary-container p-3 rounded-xl text-xs font-bold text-center">
                Password reset email sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full h-12 px-3 rounded-xl bg-surface-container text-sm text-on-surface focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
