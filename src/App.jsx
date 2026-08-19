import React, { useState } from "react";
import LandingPage from "./LandingPage.jsx";
import { LoginPage, SignUpPage, ResetPasswordPage } from "./AuthPages.jsx";
import StudentApp from "./StudentApp.jsx";
import ParentApp from "./ParentApp.jsx";
import AdminApp from "./AdminApp.jsx";

const ROLES = ["student", "parent", "admin"];

export default function App() {
  // "landing" | "login" | "signup" | "reset" | "app"
  const [view, setView] = useState("landing");
  const [role, setRole] = useState("student");

  const enterApp = (chosenRole) => {
    setRole(chosenRole);
    setView("app");
  };
  const logout = () => setView("landing");
  const nextRole = () => setRole((r) => ROLES[(ROLES.indexOf(r) + 1) % ROLES.length]);

  if (view === "landing") {
    return <LandingPage onGoToLogin={() => setView("login")} onGoToSignup={() => setView("signup")} />;
  }
  if (view === "login") {
    return (
      <LoginPage
        onLogin={enterApp}
        onGoToSignup={() => setView("signup")}
        onGoToReset={() => setView("reset")}
      />
    );
  }
  if (view === "signup") {
    return <SignUpPage onSignup={enterApp} onGoToLogin={() => setView("login")} />;
  }
  if (view === "reset") {
    return <ResetPasswordPage onGoToLogin={() => setView("login")} />;
  }

  if (role === "student") return <StudentApp onSwitchRole={nextRole} onLogout={logout} />;
  if (role === "parent") return <ParentApp onSwitchRole={nextRole} onLogout={logout} />;
  return <AdminApp onSwitchRole={nextRole} onLogout={logout} />;
}
