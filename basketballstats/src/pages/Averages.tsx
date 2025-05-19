
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart, 
  Line
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
}

interface Stat {
  id: string;
  player_id: string;
  event_id: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface PlayerAverage {
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  gamesPlayed: number;
}

interface TeamAverage {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  games: number;
}

const Averages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statistics, setStatistics] = useState<Stat[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerAverages, setPlayerAverages] = useState<PlayerAverage[]>([]);
  const [teamAverage, setTeamAverage] = useState<TeamAverage>({
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    games: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger tous les joueurs
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (playersError) throw playersError;
      
      // Charger toutes les statistiques
      const { data: statsData, error: statsError } = await supabase
        .from('statistics')
        .select('*')
        .eq('user_id', user?.id);
      
      if (statsError) throw statsError;
      
      // Charger tous les événements
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, type')
        .eq('user_id', user?.id)
        .eq('type', 'game');
      
      if (eventsError) throw eventsError;
      
      setPlayers(playersData || []);
      setStatistics(statsData || []);
      setEvents(eventsData || []);
      
      // Sélectionner le premier joueur par défaut
      if (playersData && playersData.length > 0) {
        setSelectedPlayer(playersData[0].id);
      }
      
      // Calculer les moyennes
      calculateAverages(playersData || [], statsData || [], eventsData || []);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = (players: Player[], stats: Stat[], events: Event[]) => {
    // Calculer les moyennes par joueur
    const playerStats: Record<string, PlayerAverage> = {};
    let teamTotals = {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      gamesCount: 0
    };
    
    // Initialiser les statistiques pour chaque joueur
    players.forEach(player => {
      playerStats[player.id] = {
        name: player.name,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        gamesPlayed: 0
      };
    });
    
    // Calculer les totaux pour chaque joueur
    stats.forEach(stat => {
      const playerId = stat.player_id;
      if (playerStats[playerId]) {
        playerStats[playerId].points += stat.points || 0;
        playerStats[playerId].rebounds += stat.rebounds || 0;
        playerStats[playerId].assists += stat.assists || 0;
        playerStats[playerId].steals += stat.steals || 0;
        playerStats[playerId].blocks += stat.blocks || 0;
        playerStats[playerId].gamesPlayed += 1;
        
        // Ajouter au total de l'équipe
        teamTotals.points += stat.points || 0;
        teamTotals.rebounds += stat.rebounds || 0;
        teamTotals.assists += stat.assists || 0;
        teamTotals.steals += stat.steals || 0;
        teamTotals.blocks += stat.blocks || 0;
        teamTotals.gamesCount += 1;
      }
    });
    
    // Transformer en tableau et calculer les moyennes
    const averages = Object.values(playerStats).map(player => {
      const gamesPlayed = player.gamesPlayed || 1;  // Éviter la division par zéro
      return {
        ...player,
        points: +(player.points / gamesPlayed).toFixed(1),
        rebounds: +(player.rebounds / gamesPlayed).toFixed(1),
        assists: +(player.assists / gamesPlayed).toFixed(1),
        steals: +(player.steals / gamesPlayed).toFixed(1),
        blocks: +(player.blocks / gamesPlayed).toFixed(1)
      };
    });
    
    // Filtrer les joueurs qui ont joué au moins un match
    const playersWithStats = averages.filter(player => player.gamesPlayed > 0);
    
    // Calculer la moyenne de l'équipe
    const totalGames = events.length || 1;  // Éviter la division par zéro
    const teamAvg = {
      points: +(teamTotals.points / totalGames).toFixed(1),
      rebounds: +(teamTotals.rebounds / totalGames).toFixed(1),
      assists: +(teamTotals.assists / totalGames).toFixed(1),
      steals: +(teamTotals.steals / totalGames).toFixed(1),
      blocks: +(teamTotals.blocks / totalGames).toFixed(1),
      games: totalGames
    };
    
    setPlayerAverages(playersWithStats);
    setTeamAverage(teamAvg);
  };

  const getPlayerStats = (playerId: string) => {
    const playerStats = statistics.filter(stat => stat.player_id === playerId);
    
    if (playerStats.length === 0) {
      return [];
    }
    
    // Organiser les stats par match avec les noms des matchs
    return playerStats.map(stat => {
      const event = events.find(e => e.id === stat.event_id);
      return {
        event: event?.title || 'Match inconnu',
        date: event?.date ? new Date(event.date).toLocaleDateString() : '',
        points: stat.points || 0,
        rebounds: stat.rebounds || 0,
        assists: stat.assists || 0,
        steals: stat.steals || 0,
        blocks: stat.blocks || 0
      };
    });
  };

  const renderPlayerProgress = () => {
    if (!selectedPlayer) {
      return <div>Sélectionnez un joueur pour voir sa progression</div>;
    }
    
    const playerData = getPlayerStats(selectedPlayer);
    
    if (playerData.length === 0) {
      return <div>Aucune statistique disponible pour ce joueur</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={playerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="event" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="points" name="Points" stroke="#4CAF50" />
          <Line type="monotone" dataKey="rebounds" name="Rebonds" stroke="#FF7D00" />
          <Line type="monotone" dataKey="assists" name="Passes" stroke="#2196F3" />
          <Line type="monotone" dataKey="steals" name="Interceptions" stroke="#9C27B0" />
          <Line type="monotone" dataKey="blocks" name="Contres" stroke="#F44336" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Moyennes de Performance</h1>
        
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList>
            <TabsTrigger value="team">Moyennes de l'équipe</TabsTrigger>
            <TabsTrigger value="players">Moyennes des joueurs</TabsTrigger>
            <TabsTrigger value="progress">Progression par joueur</TabsTrigger>
          </TabsList>
          
          {/* Moyennes de l'équipe */}
          <TabsContent value="team">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Moyennes de l'équipe par match</CardTitle>
                <CardDescription>
                  Statistiques moyennes de l'équipe sur {teamAverage.games} {teamAverage.games > 1 ? 'matchs' : 'match'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="w-full h-[350px]" />
                  </div>
                ) : teamAverage.games === 0 ? (
                  <div className="py-12 text-center">
                    <p>Aucune statistique d'équipe disponible. Enregistrez des statistiques de match pour voir les moyennes.</p>
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[{
                          name: 'Équipe',
                          points: teamAverage.points,
                          rebounds: teamAverage.rebounds,
                          assists: teamAverage.assists,
                          steals: teamAverage.steals,
                          blocks: teamAverage.blocks
                        }]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="points" name="Points" fill="#4CAF50" />
                        <Bar dataKey="rebounds" name="Rebonds" fill="#FF7D00" />
                        <Bar dataKey="assists" name="Passes" fill="#2196F3" />
                        <Bar dataKey="steals" name="Interceptions" fill="#9C27B0" />
                        <Bar dataKey="blocks" name="Contres" fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Moyennes des joueurs */}
          <TabsContent value="players">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Moyennes des joueurs</CardTitle>
                <CardDescription>
                  Comparaison des statistiques moyennes par joueur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="w-full h-[350px]" />
                  </div>
                ) : playerAverages.length === 0 ? (
                  <div className="py-12 text-center">
                    <p>Aucune statistique de joueur disponible. Enregistrez des statistiques de match pour voir les moyennes.</p>
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={playerAverages}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="points" name="Points" fill="#4CAF50" />
                        <Bar dataKey="rebounds" name="Rebonds" fill="#FF7D00" />
                        <Bar dataKey="assists" name="Passes" fill="#2196F3" />
                        <Bar dataKey="steals" name="Interceptions" fill="#9C27B0" />
                        <Bar dataKey="blocks" name="Contres" fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Progression par joueur */}
          <TabsContent value="progress">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Progression du joueur</CardTitle>
                <CardDescription>
                  Suivez l'évolution des performances d'un joueur au fil des matchs
                </CardDescription>
                <div className="mt-4 max-w-xs">
                  <Select
                    value={selectedPlayer || ''}
                    onValueChange={value => setSelectedPlayer(value)}
                    disabled={loading || players.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Joueurs</SelectLabel>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="w-full h-[350px]" />
                  </div>
                ) : players.length === 0 ? (
                  <div className="py-12 text-center">
                    <p>Aucun joueur disponible. Ajoutez des joueurs pour voir leur progression.</p>
                  </div>
                ) : (
                  renderPlayerProgress()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Averages;
