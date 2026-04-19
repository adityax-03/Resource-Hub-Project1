import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import api from "../services/api";

import "../styles/welcome.css";
import "../styles/form.css";

function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      return setToast({ message: "First and last name are required", type: "error", show: true });
    }
    if (!username.trim() || username.length < 3) {
      return setToast({ message: "Username must be at least 3 characters", type: "error", show: true });
    }
    if (!email.trim()) {
      return setToast({ message: "Email is required", type: "error", show: true });
    }
    if (password.length < 6) {
      return setToast({ message: "Password must be at least 6 characters", type: "error", show: true });
    }
    if (password !== confirmPassword) {
      return setToast({ message: "Passwords do not match", type: "error", show: true });
    }

    setLoading(true);
    const name = firstName + " " + lastName;

    try {
      await api.post("/api/auth/register", { name, email, password, username });
      setToast({ message: "Registration successful! Redirecting...", type: "success", show: true });
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Registration failed.", type: "error", show: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Cursor />
      <ThreeBackground />
      <div className="grain" />

      <Toast
        message={toast.message} type={toast.type} show={toast.show}
        onDismiss={() => setToast({ ...toast, show: false })}
      />

      <main>
        <div className="form-wrap liquid-glass-card">

          <Link to="/" className="back-link">Back</Link>

          <div className="form-header">
            <div className="form-logo">R</div>
            <h1 className="form-title">Create account</h1>
            <p className="form-sub">Join Resource Hub — it's completely free</p>
          </div>

          <form className="form" onSubmit={handleRegister}>
            <div className="field-row">
              <div className="field">
                <label>First Name</label>
                <div className="input-wrap">
                  <input type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Last Name</label>
                <div className="input-wrap">
                  <input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="field">
              <label>@ Username</label>
              <div className="input-wrap">
                <input type="text" placeholder="johndoe123" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().trim())} />
              </div>
            </div>

            <div className="field">
              <label>Email</label>
              <div className="input-wrap">
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input type="password" placeholder="Create a password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <input type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="form-switch">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </p>

        </div>
      </main>
    </div>
  );
}

export default Register;