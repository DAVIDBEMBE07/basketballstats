
import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase, cleanupAuthState } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          // Handle sign out event if needed
        } else if (event === 'SIGNED_IN') {
          // Defer any Supabase calls to prevent deadlocks
          setTimeout(() => {
            // You could fetch user profile or other data here
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Vous êtes connecté à votre compte.",
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Sign up with email/password and metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Compte créé avec succès",
        description: "Vous êtes maintenant inscrit et connecté.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer un compte. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message || "Impossible de se déconnecter. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (data: { username?: string; avatar_url?: string }) => {
    try {
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      // Update user metadata
      if (data.username) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { username: data.username }
        });
        
        if (metadataError) throw metadataError;
      }

      // Update profile in public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
