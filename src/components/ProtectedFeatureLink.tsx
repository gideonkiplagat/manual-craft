import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedFeatureLink({ to, children, className }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate("/#pricing");
      return;
    }

    if (user.plan === "free") {
      e.preventDefault();
      navigate("/#pricing");
      return;
    }
  };

  return (
    <Link to={to} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
