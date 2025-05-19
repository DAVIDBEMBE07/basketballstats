
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Game } from '@/types/gameTypes';

// Composants refactorisés
import GameFormDialog from '@/components/games/GameFormDialog';
import PlayerStatsForm from '@/components/games/PlayerStatsForm';
import GamesList from '@/components/games/GamesList';

const Games = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [user]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'game')  // Filtrer pour n'obtenir que les matchs
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setGames(data as Game[]);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les matchs.",
        variant: "destructive",
      });
      console.error("Error loading games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingGame(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (game: Game) => {
    setEditingGame(game);
    setIsDialogOpen(true);
  };

  const openStatsDialog = (gameId: string) => {
    setSelectedGameId(gameId);
    setIsStatsDialogOpen(true);
  };

  const deleteGame = async (gameId: string) => {
    try {
      // Supprimer d'abord toutes les statistiques liées à ce match
      await supabase
        .from('statistics')
        .delete()
        .eq('event_id', gameId);
        
      // Supprimer ensuite le match
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', gameId);
      
      if (error) throw error;
      
      toast({
        title: "Match supprimé",
        description: "Le match et toutes les statistiques associées ont été supprimés avec succès.",
      });
      
      loadGames();
    } catch (error: any) {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer le match.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des matchs</h1>
            <p className="text-muted-foreground">
              Planifiez et suivez tous les matchs de votre équipe.
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un match
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matchs à venir & passés</CardTitle>
            <CardDescription>
              Liste de tous les matchs programmés pour votre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GamesList
              games={games}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={deleteGame}
              onOpenStats={openStatsDialog}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour ajouter/modifier un match */}
      <GameFormDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingGame={editingGame}
        onGameSaved={loadGames}
      />
      
      {/* Dialog pour les statistiques des joueurs */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Statistiques des joueurs
            </DialogTitle>
            <DialogDescription>
              Ajoutez ou modifiez les statistiques des joueurs pour ce match
            </DialogDescription>
          </DialogHeader>
          
          {selectedGameId && (
            <PlayerStatsForm 
              gameId={selectedGameId} 
              onClose={() => setIsStatsDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Games;
