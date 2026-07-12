import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

function VerifyOtpPage() {
  const { verifyOtp } = useAuth();
  const location = useLocation();

  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  useEffect(() => {
  if (resendTimer <= 0) return;

  const timer = setInterval(() => {
    setResendTimer((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setResendMessage('');

    if (!email) {
      setError("Email not found. Please go back to signup.");
      return;
    }

    setLoading(true);

    const result = await verifyOtp(email, otp);

    if (!result.success) {
      setError(result.message || 'OTP verification failed.');
    }

    setLoading(false);
  };


  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found. Please go back to signup.");
      return;
    }

    try {
      setResending(true);
      setError('');
      setResendMessage('');

      const response = await fetch(
        `http://localhost:8080/api/users/resend-otp?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data);
      }

     setResendMessage("✅ New OTP sent to your email!");
setResendTimer(10);   

    } catch (err) {
      setError(err.message || "Failed to resend OTP.");

    } finally {
      setResending(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">

        <h1 className="text-3xl font-bold text-rose-800 mb-6 text-center">
          Verify OTP
        </h1>

        <p className="text-gray-600 mb-4 text-center">
          A verification code has been sent to your email:
          <span className="font-semibold"> {email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            required
            disabled={loading || resending}
          />

          {error && (
            <p className="text-red-500 text-sm">
              {error}
            </p>
          )}

          {resendMessage && (
            <p className="text-green-500 text-sm">
              {resendMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold p-3 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || resending}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

        </form>


        <p className="text-center text-gray-600 mt-4">
          Didn't receive the code?{' '}

          <button
onClick={handleResendOtp}
className="text-rose-600 hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
disabled={loading || resending || resendTimer > 0}
>
{resending
  ? "Resending..."
  : resendTimer > 0
  ? `Resend OTP in ${resendTimer}s`
  : "Resend OTP"}
</button>

        </p>


        <p className="text-center text-gray-600 mt-2">
          <Link 
            to="/login" 
            className="text-rose-600 hover:underline"
          >
            Back to Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default VerifyOtpPage;