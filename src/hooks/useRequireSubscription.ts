import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed

export const useRequireSubscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // not logged in, let other guards handle this

    const plan = user?.plan_type; // e.g. "free", "pro", "team"

    if (!plan || plan === "free") {
      navigate("/subscribe");
    }
  }, [user, navigate]);
};
