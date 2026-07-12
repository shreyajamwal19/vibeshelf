import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


function ResetPasswordPage() {

const location = useLocation();
const navigate = useNavigate();

const email = location.state?.email || "";

const [otp, setOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);



const handleSubmit = async (e) => {
e.preventDefault();

setError("");
setMessage("");


if (!email) {
setError("Email not found. Please restart password reset.");
return;
}


if (newPassword !== confirmPassword) {
setError("Passwords do not match.");
return;
}


try {

setLoading(true);


const response = await fetch(
`http://localhost:8080/api/users/reset-password?email=${encodeURIComponent(email)}&otp=${otp}&newPassword=${encodeURIComponent(newPassword)}`,
{
method: "POST",
}
);


const data = await response.text();


if (!response.ok) {
throw new Error(data);
}


setMessage("✅ Password reset successful! Redirecting to login...");


setTimeout(() => {
navigate("/login");
}, 1500);



} catch(err) {

setError(err.message || "Failed to reset password.");

} finally {

setLoading(false);

}

};



return (

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">


<div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">


<h1 className="text-3xl font-bold text-rose-800 text-center mb-6">
Reset Password
</h1>


<p className="text-gray-600 text-center mb-5">
Enter the OTP sent to your email and create a new password.
</p>


<form onSubmit={handleSubmit} className="space-y-4">


<input
type="text"
placeholder="Enter OTP"
value={otp}
onChange={(e)=>setOtp(e.target.value)}
required
disabled={loading}
className="w-full p-3 border border-rose-300 rounded-lg"
/>


<input
type="password"
placeholder="New Password"
value={newPassword}
onChange={(e)=>setNewPassword(e.target.value)}
required
disabled={loading}
className="w-full p-3 border border-rose-300 rounded-lg"
/>


<input
type="password"
placeholder="Confirm Password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
required
disabled={loading}
className="w-full p-3 border border-rose-300 rounded-lg"
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
{loading ? "Resetting..." : "Reset Password"}
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


export default ResetPasswordPage;