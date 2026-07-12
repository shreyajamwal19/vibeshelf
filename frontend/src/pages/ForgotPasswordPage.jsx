import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:8080/api/users/forgot-password?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data);
      }

      setMessage("✅ Reset OTP sent to your email!");

     navigate("/reset-password", {
  state: { email },
});

    } catch (err) {
      setError(err.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">

      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-rose-800 text-center mb-6">
          Forgot Password?
        </h1>

        <p className="text-gray-600 text-center mb-5">
          Enter your email and we'll send you a reset OTP.
        </p>


        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-400"
          />


          {error && (
            <p className="text-red-500 text-sm">
              {error}
            </p>
          )}

          {message && (
            <p className="text-green-500 text-sm">
              {message}
            </p>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send Reset OTP"}
          </button>

        </form>


        <p className="text-center mt-5">
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

export default ForgotPasswordPage;
