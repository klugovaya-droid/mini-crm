import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { mapAuthError } from "@/lib/auth-errors";
import type { Database } from "@/lib/database.types";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseClient } from "@/lib/supabase";
import type { Profile } from "@/types/domain";

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configError: string | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

type Client = SupabaseClient<Database>;

function useSupabaseClient(): Client | null {
  return useMemo(() => {
    if (!hasSupabaseEnv()) return null;
    return getSupabaseClient();
  }, []);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [profileError, setProfileError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const loadProfile = useCallback(
    async (nextSession: Session | null) => {
      if (!client) return;
      if (!nextSession) {
        if (!sessionRef.current) {
          setProfile(null);
          setProfileError(null);
        }
        return;
      }

      const userId = nextSession.user.id;
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (sessionRef.current?.user.id !== userId) return;

      if (error) {
        setProfile(null);
        setProfileError("Не удалось загрузить профиль. Обновите страницу.");
        return;
      }

      setProfile(data);
      setProfileError(null);
    },
    [client],
  );

  useEffect(() => {
    if (!client) return;

    let active = true;

    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        sessionRef.current = data.session;
        setSession(data.session);
        void loadProfile(data.session);
      }
      setLoading(false);
    });

    const { data: subscription } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active || event === "INITIAL_SESSION") return;

      if (event === "SIGNED_OUT") {
        // A late SIGNED_OUT from the previous session must not clear a new login.
        if (sessionRef.current) return;
        setSession(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      sessionRef.current = nextSession;
      setSession(nextSession);
      setLoading(false);
      void loadProfile(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [client, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error("Supabase не настроен.");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(mapAuthError(error.message));
      sessionRef.current = data.session;
      setSession(data.session);
      setLoading(false);
      await loadProfile(data.session);
    },
    [client, loadProfile],
  );

  const signOut = useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
    sessionRef.current = null;
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setLoading(false);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configError: client
        ? null
        : "Не настроены VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Проверьте окружение.",
      profileError,
      signIn,
      signOut,
    }),
    [session, profile, loading, client, profileError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
