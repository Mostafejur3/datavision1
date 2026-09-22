import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";


export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "moderator" | null>(null);

  // Check if current user has admin or moderator role
  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAuthenticated(false);
      setUserRole(null);
      setLoading(false);
      return;
    }
    // Check admin first
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
    if (isAdmin) {
      setIsAuthenticated(true);
      setUserRole("admin");
      setLoading(false);
      return;
    }
    // Check moderator
    const { data: isMod } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "moderator" });
    if (isMod) {
      setIsAuthenticated(true);
      setUserRole("moderator");
      setLoading(false);
      return;
    }
    setIsAuthenticated(false);
    setUserRole(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    return () => subscription.unsubscribe();
  }, [checkAdmin]);

  const login = useCallback(async (email: string, password: string): Promise<string | true> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
  }, []);

  return { isAuthenticated, loading, login, logout, userRole };
}
