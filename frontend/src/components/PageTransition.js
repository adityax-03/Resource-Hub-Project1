import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smooth page transition wrapper — fade + slide on route change.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState("enter");

  useEffect(() => {
    setTransitionState("exit");

    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionState("enter");
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className={`page-transition page-transition-${transitionState}`}>
      {displayChildren}
    </div>
  );
}
