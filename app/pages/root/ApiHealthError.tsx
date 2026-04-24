import { useEffect } from "react";
import { useNavigate } from "react-router";

/** Legacy URL: the root layout’s ApiHealthGate handles outages; normalize to home. */
export default function ApiHealthError() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
