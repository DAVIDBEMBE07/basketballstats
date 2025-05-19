
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Player, PlayerStat } from '@/types/gameTypes';

interface PlayerStatsFormProps {
  gameId: string;
  onClose: () => void;
}

const PlayerStatsForm: React.FC<PlayerStatsFormProps> = ({ gameId, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gameTitle, setGameTitle] = useState("");

  // Charger les joueurs et les statistiques au chargement de la page
  useEffect(() => {
    if (user && gameId) {
      loadData();
    }
  }, [user, gameId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Charger le nom du match
      const { data: gameData, error: gameError } = await supabase
        .from('events')
        .select('title')
        .eq('id', gameId)
        .single();
      
      if (gameError) throw gameError;
      if (gameData) {
        setGameTitle(gameData.title);
      }
      
      // Charger tous les joueurs
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });
      
      if (playersError) throw playersError;
      setPlayers(playersData || []);
      
      // Charger les statistiques existantes pour ce match
      const { data: statsData, error: statsError } = await supabase
        .from('statistics')
        .select('*')
        .eq('event_id', gameId)
        .eq('user_id', user?.id);
      
      if (statsError) throw statsError;
      
      // Initialiser les statistiques pour tous les joueurs
      const initialStats: Record<string, PlayerStat> = {};
      
      playersData?.forEach(player => {
        // Trouver les statistiques existantes pour ce joueur
        const existingStat = statsData?.find(stat => stat.player_id === player.id);
        
        if (existingStat) {
          initialStats[player.id] = existingStat;
        } else {
          // Par défaut, tous les compteurs à 0
          initialStats[player.id] = {
            player_id: player.id,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            event_id: gameId
          };
        }
      });
      
      setPlayerStats(initialStats);
    } catch (error: any) {
      toast({
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatChange = (playerId: string, statName: keyof PlayerStat, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statName]: numValue
      }
    }));
  };
  
  const saveAllStats = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      // Pour chaque joueur, insérer ou mettre à jour les statistiques
      for (const playerId of Object.keys(playerStats)) {
        const playerStat = playerStats[playerId];
        
        if (playerStat.id) {
          // Mise à jour d'une statistique existante
          const { error } = await supabase
            .from('statistics')
            .update({
              points: playerStat.points,
              rebounds: playerStat.rebounds,
              assists: playerStat.assists,
              steals: playerStat.steals,
              blocks: playerStat.blocks,
              updated_at: new Date().toISOString()
            })
            .eq('id', playerStat.id);
          
          if (error) throw error;
        } else {
          // Création d'une nouvelle statistique
          const { error } = await supabase
            .from('statistics')
            .insert({
              player_id: playerId,
              event_id: gameId,
              user_id: user.id,
              points: playerStat.points,
              rebounds: playerStat.rebounds,
              assists: playerStat.assists,
              steals: playerStat.steals,
              blocks: playerStat.blocks
            });
          
          if (error) throw error;
        }
      }
      
      toast({
        title: "Statistiques sauvegardées",
        description: "Les statistiques des joueurs ont été sauvegardées avec succès.",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder les statistiques.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">
          {gameTitle ? `Statistiques pour "${gameTitle}"` : 'Statistiques du match'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Entrez les statistiques pour chaque joueur
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-6">
          <p>Aucun joueur disponible. Ajoutez d'abord des joueurs.</p>
          <Button className="mt-2" onClick={onClose}>Fermer</Button>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-x-auto max-h-[400px] dark:border-gray-700">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <TableRow>
                  <TableHead>Joueur</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Rebonds</TableHead>
                  <TableHead className="text-center">Passes</TableHead>
                  <TableHead className="text-center">Interceptions</TableHead>
                  <TableHead className="text-center">Contres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const stats = playerStats[player.id];
                  if (!stats) return null;
                  
                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stats.points || 0}
                          onChange={(e) => handleStatChange(player.id, 'points', e.target.value)}
                          className="h-9 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stats.rebounds || 0}
                          onChange={(e) => handleStatChange(player.id, 'rebounds', e.target.value)}
                          className="h-9 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stats.assists || 0}
                          onChange={(e) => handleStatChange(player.id, 'assists', e.target.value)}
                          className="h-9 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stats.steals || 0}
                          onChange={(e) => handleStatChange(player.id, 'steals', e.target.value)}
                          className="h-9 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={stats.blocks || 0}
                          onChange={(e) => handleStatChange(player.id, 'blocks', e.target.value)}
                          className="h-9 text-center"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={saveAllStats} disabled={isSaving}>
              {isSaving ? "Sauvegarde en cours..." : "Sauvegarder les statistiques"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerStatsForm;
