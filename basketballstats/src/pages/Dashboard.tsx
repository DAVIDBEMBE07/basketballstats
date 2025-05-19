
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Users, Trophy, Gamepad, BarChart, ThumbsDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link } from 'react-router-dom';

interface DashboardStats {
  playerCount: number;
  gameCount: number;
  victories: number;
  defeats: number;
  attendanceRate: number;
  lastAttendanceDate: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    playerCount: 0,
    gameCount: 0,
    victories: 0,
    defeats: 0,
    attendanceRate: 0,
    lastAttendanceDate: null
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || "");
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger le nombre de joueurs
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user?.id);
      
      if (playersError) throw playersError;

      // Charger le nombre total de matchs
      const { data: games, error: gamesError } = await supabase
        .from('events')
        .select('id, date, result')
        .eq('user_id', user?.id)
        .eq('type', 'game');
      
      if (gamesError) throw gamesError;

      // Compter les victoires et défaites
      const victories = games?.filter(game => game.result === 'win').length || 0;
      const defeats = games?.filter(game => game.result === 'loss').length || 0;

      // Calculer le taux de présence
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('present, event_id')
        .eq('user_id', user?.id);
        
      if (attendanceError) throw attendanceError;
      
      let attendanceRate = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(record => record.present).length;
        attendanceRate = (presentCount / attendanceData.length) * 100;
      }
      
      // Trouver la dernière date de présence enregistrée
      let lastAttendanceDate = null;
      if (attendanceData && attendanceData.length > 0) {
        const eventIds = [...new Set(attendanceData.map(record => record.event_id))];
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('date')
          .in('id', eventIds)
          .order('date', { ascending: false })
          .limit(1);
          
        if (eventsError) throw eventsError;
        if (events && events.length > 0) {
          lastAttendanceDate = events[0].date;
        }
      }

      setStats({
        playerCount: players?.length || 0,
        gameCount: games?.length || 0,
        victories: victories,
        defeats: defeats,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        lastAttendanceDate
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date pour l'affichage
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Aucune donnée';
    
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statCards = [
    {
      title: 'Joueurs',
      value: stats.playerCount,
      description: 'Joueurs enregistrés',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500',
      link: '/players'
    },
    {
      title: 'Matchs',
      value: stats.gameCount,
      description: 'Matchs joués',
      icon: <Gamepad className="h-5 w-5" />,
      color: 'bg-green-500',
      link: '/games'
    },
    {
      title: 'Victoires',
      value: stats.victories,
      description: 'Matchs gagnés',
      icon: <Trophy className="h-5 w-5" />,
      color: 'bg-amber-500',
      link: '/games'
    },
    {
      title: 'Défaites',
      value: stats.defeats,
      description: 'Matchs perdus',
      icon: <ThumbsDown className="h-5 w-5" />,
      color: 'bg-red-500',
      link: '/games'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {username}! Voici un aperçu de votre équipe.
          </p>
        </div>

        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {statCards.map((card, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-12 w-24" />
                  ) : (
                    <div className="text-3xl font-bold">{card.value}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
                <div className={`h-1 w-full ${card.color}`}></div>
                <CardFooter className="pt-2">
                  <Button variant="ghost" size="sm" asChild className="ml-auto">
                    <Link to={card.link}>
                      Voir détails
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {/* Dernière activité */}
          <Card className="col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Activités récentes</CardTitle>
              <CardDescription>
                Résumé des dernières activités de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-md border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dernière présence enregistrée</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.lastAttendanceDate 
                          ? formatDate(stats.lastAttendanceDate)
                          : "Aucune présence enregistrée"}
                      </p>
                    </div>
                  </div>
                  {stats.playerCount === 0 ? (
                    <div className="flex items-center justify-center h-24 border rounded-md p-4">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-3">Pour commencer, ajoutez des joueurs à votre équipe</p>
                        <Button asChild>
                          <Link to="/players">Ajouter des joueurs</Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accès rapides */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Accès rapides</CardTitle>
              <CardDescription>
                Fonctionnalités fréquemment utilisées
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/players">
                  <Users className="mr-2 h-4 w-4" /> Gérer les joueurs
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/games">
                  <Gamepad className="mr-2 h-4 w-4" /> Gérer les matchs
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/statistics">
                  <BarChart className="mr-2 h-4 w-4" /> Voir les statistiques
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/attendance">
                  <BarChart className="mr-2 h-4 w-4" /> Marquer les présences
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
