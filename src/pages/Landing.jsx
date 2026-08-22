import { useNavigate } from "react-router-dom";
import LandingPage from "../LandingPage.jsx";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGoToLogin={() => navigate("/login")}
      onGoToSignup={() => navigate("/signup")}
    />
  );
}
