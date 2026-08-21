import React, { useEffect, useState } from "react";
import LandingPage from "./LandingPage.jsx";
import { LoginPage, SignUpPage, ResetPasswordPage } from "./AuthPages.jsx";
import StudentApp from "./StudentApp.jsx";
import ParentApp from "./ParentApp.jsx";
import AdminApp from "./AdminApp.jsx";
import { supabase } from "./supabase/client.js";

export default function App() {
  // "landing" | "login" | "signup" | "reset" | "app"
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  useEffect(() => {
    const isMagicLink = /[#?]access_token=/.test(window.location.hash);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);

        if (isMagicLink) {
          // Clean the URL hash so refreshes don't re-trigger
          window.history.replaceState({}, "", window.location.pathname);
          // Magic link = already verified — go straight to the app
          onLogin(session.user);
        }

        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.role) setRole(data.role);
          });
      } else {
        setUser(null);
        setRole("student");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onLogin = async (u) => {
    setUser(u);
    // Profile may not exist yet right after OTP verification — retry briefly
    let profile = null;
    for (let i = 0; i < 8; i++) {
      const { data } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("id", u.id)
        .maybeSingle();
      if (data) {
        profile = data;
        break;
      }
      if (i < 7) await new Promise((r) => setTimeout(r, 250));
    }

if (profile?.role) {
      setRole(profile.role);
      setView("app");
    } else {
      // No profile — the login page shows the OTP screen to finish verification
      setError("Please verify your email to continue.");
      setView("login");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole("student");
    setView("landing");
  };

  if (view === "landing") {
    return <LandingPage onGoToLogin={() => setView("login")} onGoToSignup={() => setView("signup")} />;
  }
  if (view === "login") {
    return (
      <LoginPage
        onLogin={onLogin}
        onGoToSignup={() => setView("signup")}
        onGoToReset={() => setView("reset")}
        error={error}
      />
    );
  }
  if (view === "signup") {
    return <SignUpPage onGoToLogin={() => setView("login")} />;
  }
  if (view === "reset") {
    return <ResetPasswordPage onGoToLogin={() => setView("login")} />;
  }

  if (role === "student") return <StudentApp user={user} onLogout={logout} />;
  if (role === "parent") return <ParentApp user={user} onLogout={logout} />;
  return <AdminApp user={user} onLogout={logout} />;
}