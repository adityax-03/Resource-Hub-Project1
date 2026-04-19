import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import api from "../services/api";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return setToast({ message: "Please fill in all fields", type: "error", show: true });
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      login(res.data.token, res.data.user);
      setToast({ message: res.data.message, type: "success", show: true });
      navigate("/dashboard");
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Login failed", type: "error", show: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Cursor />
      <ThreeBackground />
      <div className="grain" />

      <Toast
        message={toast.message} type={toast.type} show={toast.show}
        onDismiss={() => setToast({ ...toast, show: false })}
      />

      <main>
        <div className="card liquid-glass-card">

          <div className="card-top">
            <Link to="/" className="back-btn">Back</Link>
            <div className="brand">
              <span className="brand-r">Resource</span>
              <span className="brand-h">Hub</span>
            </div>
          </div>

          <h2 className="card-title">
            Welcome back<span className="dot-acc" />
          </h2>

          <p className="card-sub">Sign in to your Resource Hub account</p>

          <form className="form" onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}>👁</button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="switch-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>

        </div>
      </main>
    </>
  );
}

export default Login;