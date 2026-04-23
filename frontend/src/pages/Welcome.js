import { Link } from "react-router-dom";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import "../styles/welcome.css";

function Welcome() {
  return (
    <div>
      <Cursor />
      <ThreeBackground />
      <div className="grain" />

      <main>
        <div className="wrap">

          <div className="tag">
            <span className="ping" />
            Your Team Workspace
          </div>

          <div className="title-wrap">
            <span className="t1">Resource</span>
            <span className="t2">
              <span className="t2-inner">Hub</span>
              <span className="dot-blink" />
            </span>
          </div>

          <p className="sub">
            Your central place to manage, share & track team resources — simple, fast, together.
          </p>

          <div className="btns">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-ghost">Register</Link>
          </div>

          <p className="hint">
            Free forever plan
          </p>

        </div>
      </main>
    </div>
  );
}

export default Welcome;