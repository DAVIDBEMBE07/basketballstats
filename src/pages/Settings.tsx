
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Moon, 
  Sun,
  Laptop,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse e-mail valide.",
  }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Le mot de passe actuel est requis.",
  }),
  newPassword: z.string().min(6, {
    message: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
  }),
  confirmPassword: z.string().min(6, {
    message: "La confirmation du mot de passe doit contenir au moins 6 caractères.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState('light');
  
  // Formulaire du profil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });
  
  // Formulaire du mot de passe
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Charger les données du profil
  useEffect(() => {
    if (user) {
      loadProfile();
    }
    
    // Charger le thème actuel
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Charger le profil depuis Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      
      // Initialiser les valeurs du formulaire
      profileForm.reset({
        username: data.username || user?.user_metadata?.username || "",
        email: user?.email || "",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du profil.",
        variant: "destructive",
      });
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      // Mise à jour du profil via le hook d'authentification
      await updateProfile({
        username: values.username,
      });
      
      // Recharger le profil
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: values.currentPassword,
      });
      
      if (signInError) {
        toast({
          title: "Mot de passe incorrect",
          description: "Le mot de passe actuel est incorrect.",
          variant: "destructive",
        });
        return;
      }
      
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
      
      // Réinitialiser le formulaire
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le mot de passe.",
        variant: "destructive",
      });
    }
  };

  // Fonctions pour gérer le thème
  const applyTheme = (newTheme: string) => {
    const root = window.document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (systemTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const changeTheme = (newTheme: string) => {
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre compte et vos préférences d'affichage.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              <span>Profil</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
              <span>Apparence</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de profil</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom d'utilisateur</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              L'email ne peut pas être modifié.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Enregistrer les modifications</Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe actuel</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmez le mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Modifier le mot de passe</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet Apparence */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Thème</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choisissez le thème de l'interface.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={`border cursor-pointer ${theme === 'light' ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => changeTheme('light')}>
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                          <Sun size={18} />
                          <span className="font-medium">Clair</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="h-20 bg-white border rounded-md flex items-center justify-center">
                          <div className="w-12 h-6 bg-primary rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className={`border cursor-pointer ${theme === 'dark' ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => changeTheme('dark')}>
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                          <Moon size={18} />
                          <span className="font-medium">Sombre</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="h-20 bg-gray-900 border border-gray-800 rounded-md flex items-center justify-center">
                          <div className="w-12 h-6 bg-primary rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className={`border cursor-pointer ${theme === 'system' ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => changeTheme('system')}>
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                          <Laptop size={18} />
                          <span className="font-medium">Système</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="h-20 bg-gradient-to-r from-white to-gray-900 border rounded-md flex items-center justify-center">
                          <div className="w-12 h-6 bg-primary rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Le thème est automatiquement sauvegardé lorsque vous le modifiez.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
