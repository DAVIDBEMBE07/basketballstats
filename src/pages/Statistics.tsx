
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface Statistic {
  id: string;
  player_id: string;
  event_id: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

interface StatView {
  player: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  event: string;
  date: string;
}

const Statistics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [statViews, setStatViews] = useState<StatView[]>([]);
  const [activeTab, setActiveTab] = useState('players');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    prepareStatViews();
  }, [statistics, players, events, selectedPlayer, selectedEvent, activeTab]);

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
      
      // Charger tous les événements (matchs)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, type')
        .eq('user_id', user?.id)
        .eq('type', 'game')
        .order('date', { ascending: false });
      
      if (eventsError) throw eventsError;
      
      // Charger toutes les statistiques
      const { data: statsData, error: statsError } = await supabase
        .from('statistics')
        .select('*')
        .eq('user_id', user?.id);
      
      if (statsError) throw statsError;
      
      setPlayers(playersData || []);
      setEvents(eventsData || []);
      setStatistics(statsData || []);
      
      // Sélectionner le premier joueur par défaut
      if (playersData && playersData.length > 0) {
        setSelectedPlayer(playersData[0].id);
      }
      
      // Sélectionner le premier événement par défaut
      if (eventsData && eventsData.length > 0) {
        setSelectedEvent(eventsData[0].id);
      }
      
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

  const prepareStatViews = () => {
    if (!statistics.length || !players.length || !events.length) {
      setStatViews([]);
      return;
    }

    let filteredStats = [...statistics];

    if (activeTab === 'players' && selectedPlayer) {
      filteredStats = filteredStats.filter(stat => stat.player_id === selectedPlayer);
    }

    if (activeTab === 'events' && selectedEvent) {
      filteredStats = filteredStats.filter(stat => stat.event_id === selectedEvent);
    }

    const views = filteredStats.map(stat => {
      const player = players.find(p => p.id === stat.player_id);
      const event = events.find(e => e.id === stat.event_id);
      
      return {
        player: player?.name || 'Joueur inconnu',
        points: stat.points || 0,
        rebounds: stat.rebounds || 0,
        assists: stat.assists || 0,
        steals: stat.steals || 0,
        blocks: stat.blocks || 0,
        event: event?.title || 'Match inconnu',
        date: event?.date ? format(new Date(event.date), 'PPP', { locale: fr }) : 'Date inconnue'
      };
    });

    setStatViews(views);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: fr });
  };

  // Calcul du total pour chaque type de statistique
  const calculateTotals = () => {
    if (!statViews.length) return null;

    return {
      points: statViews.reduce((sum, stat) => sum + stat.points, 0),
      rebounds: statViews.reduce((sum, stat) => sum + stat.rebounds, 0),
      assists: statViews.reduce((sum, stat) => sum + stat.assists, 0),
      steals: statViews.reduce((sum, stat) => sum + stat.steals, 0),
      blocks: statViews.reduce((sum, stat) => sum + stat.blocks, 0)
    };
  };

  const totals = calculateTotals();

  // Préparation des données pour le graphique
  const getChartData = () => {
    if (activeTab === 'players' && selectedPlayer) {
      // Graphique des statistiques d'un joueur par match
      return statViews.map(stat => ({
        name: stat.event,
        points: stat.points,
        rebounds: stat.rebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks
      }));
    } else if (activeTab === 'events' && selectedEvent) {
      // Graphique des statistiques par joueur pour un match spécifique
      return statViews.map(stat => ({
        name: stat.player,
        points: stat.points,
        rebounds: stat.rebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks
      }));
    }
    
    return [];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-muted-foreground">
            Consultez les statistiques détaillées des joueurs et des matchs.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">Par joueur</TabsTrigger>
            <TabsTrigger value="events">Par match</TabsTrigger>
          </TabsList>
          
          <TabsContent value="players" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Sélectionnez un joueur</CardTitle>
                <CardDescription>
                  Consultez les statistiques d'un joueur spécifique
                </CardDescription>
                <div className="pt-2">
                  {loading ? (
                    <Skeleton className="h-10 w-full max-w-xs" />
                  ) : players.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Aucun joueur disponible. Ajoutez des joueurs dans la section "Joueurs".
                    </div>
                  ) : (
                    <Select 
                      value={selectedPlayer || undefined} 
                      onValueChange={setSelectedPlayer}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Sélectionner un joueur" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
            </Card>

            {selectedPlayer && !loading && (
              <>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle>Statistiques détaillées</CardTitle>
                    <CardDescription>
                      Performance du joueur {players.find(p => p.id === selectedPlayer)?.name} par match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statViews.length === 0 ? (
                      <div className="py-8 text-center">
                        <p>Aucune statistique disponible pour ce joueur.</p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-x-auto dark:border-gray-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Match</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Points</TableHead>
                              <TableHead className="text-right">Rebonds</TableHead>
                              <TableHead className="text-right">Passes</TableHead>
                              <TableHead className="text-right">Interceptions</TableHead>
                              <TableHead className="text-right">Contres</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statViews.map((stat, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{stat.event}</TableCell>
                                <TableCell>{stat.date}</TableCell>
                                <TableCell className="text-right">{stat.points}</TableCell>
                                <TableCell className="text-right">{stat.rebounds}</TableCell>
                                <TableCell className="text-right">{stat.assists}</TableCell>
                                <TableCell className="text-right">{stat.steals}</TableCell>
                                <TableCell className="text-right">{stat.blocks}</TableCell>
                              </TableRow>
                            ))}
                            {totals && (
                              <TableRow className="font-bold">
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell className="text-right">{totals.points}</TableCell>
                                <TableCell className="text-right">{totals.rebounds}</TableCell>
                                <TableCell className="text-right">{totals.assists}</TableCell>
                                <TableCell className="text-right">{totals.steals}</TableCell>
                                <TableCell className="text-right">{totals.blocks}</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle>Progression du joueur</CardTitle>
                    <CardDescription>
                      Évolution des performances du joueur au fil des matchs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statViews.length === 0 ? (
                      <div className="py-8 text-center">
                        <p>Aucune statistique disponible pour générer un graphique.</p>
                      </div>
                    ) : (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getChartData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80} 
                              tick={{ fontSize: 12 }}
                            />
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
              </>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Sélectionnez un match</CardTitle>
                <CardDescription>
                  Consultez les statistiques d'un match spécifique
                </CardDescription>
                <div className="pt-2">
                  {loading ? (
                    <Skeleton className="h-10 w-full max-w-xs" />
                  ) : events.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Aucun match disponible. Ajoutez des matchs dans la section "Matchs".
                    </div>
                  ) : (
                    <Select 
                      value={selectedEvent || undefined} 
                      onValueChange={setSelectedEvent}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Sélectionner un match" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} ({formatDate(event.date)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
            </Card>

            {selectedEvent && !loading && (
              <>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle>Statistiques du match</CardTitle>
                    <CardDescription>
                      Performances des joueurs pour le match {events.find(e => e.id === selectedEvent)?.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statViews.length === 0 ? (
                      <div className="py-8 text-center">
                        <p>Aucune statistique disponible pour ce match.</p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-x-auto dark:border-gray-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Joueur</TableHead>
                              <TableHead className="text-right">Points</TableHead>
                              <TableHead className="text-right">Rebonds</TableHead>
                              <TableHead className="text-right">Passes</TableHead>
                              <TableHead className="text-right">Interceptions</TableHead>
                              <TableHead className="text-right">Contres</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statViews.map((stat, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{stat.player}</TableCell>
                                <TableCell className="text-right">{stat.points}</TableCell>
                                <TableCell className="text-right">{stat.rebounds}</TableCell>
                                <TableCell className="text-right">{stat.assists}</TableCell>
                                <TableCell className="text-right">{stat.steals}</TableCell>
                                <TableCell className="text-right">{stat.blocks}</TableCell>
                              </TableRow>
                            ))}
                            {totals && (
                              <TableRow className="font-bold">
                                <TableCell>Total équipe</TableCell>
                                <TableCell className="text-right">{totals.points}</TableCell>
                                <TableCell className="text-right">{totals.rebounds}</TableCell>
                                <TableCell className="text-right">{totals.assists}</TableCell>
                                <TableCell className="text-right">{totals.steals}</TableCell>
                                <TableCell className="text-right">{totals.blocks}</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle>Performance par joueur</CardTitle>
                    <CardDescription>
                      Comparaison des performances des joueurs pour ce match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statViews.length === 0 ? (
                      <div className="py-8 text-center">
                        <p>Aucune statistique disponible pour générer un graphique.</p>
                      </div>
                    ) : (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getChartData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80} 
                              tick={{ fontSize: 12 }}
                            />
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
