import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={{
      width: "200px",
      height: "100vh",
      background: "#f2f2f2",
      padding: "20px"
    }}>

      <h3>Team Resource Hub</h3>

      <p>
        <Link to="/dashboard">Dashboard</Link>
      </p>

      <p>
        <Link to="/team">Teams</Link>
      </p>

      <p>
        <Link to="/resources">Resources</Link>
      </p>

      <p>
        <Link to="/">Logout</Link>
      </p>

    </div>
  );
}

export default Sidebar;