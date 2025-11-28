import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedFeatureLink({ to, children, className }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (!user || user.plan_type === "free") {
      e.preventDefault();
      navigate("/subscribe");
    }
  };

  return (
    <Link to={to} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
