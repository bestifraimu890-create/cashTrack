import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";

const AuthContext = createContext({ user: null, role: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRole = async (uid) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
    if (data?.role) setRole(data.role);
    return data?.role ?? null;
  };

  useEffect(() => {
    const isMagicLink = /[#?]access_token=/.test(window.location.hash);

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) await fetchRole(sessionUser.id);
      setLoading(false);

      if (isMagicLink && sessionUser) {
        // Magic link = already verified — clean the URL and go straight to the app
        window.history.replaceState({}, "", window.location.pathname);
        navigate("/app", { replace: true });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setRole(null);
      } else {
        fetchRole(session.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, setRole, fetchRole, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
