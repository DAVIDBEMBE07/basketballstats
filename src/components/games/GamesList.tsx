
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Edit, Trash2, LineChart } from 'lucide-react';
import { Game } from '@/types/gameTypes';
import { useState } from 'react';

interface GamesListProps {
  games: Game[];
  isLoading: boolean;
  onEdit: (game: Game) => void;
  onDelete: (gameId: string) => void;
  onOpenStats: (gameId: string) => void;
}

const GamesList: React.FC<GamesListProps> = ({
  games,
  isLoading,
  onEdit,
  onDelete,
  onOpenStats
}) => {
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  
  // Formatage de la date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP", { locale: fr });
  };

  // Style pour le résultat du match
  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600">Victoire</Badge>;
      case 'loss':
        return <Badge className="bg-red-500 hover:bg-red-600">Défaite</Badge>;
      case 'draw':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Égalité</Badge>;
      default:
        return null;
    }
  };
  
  const getResultClass = (result: string | null) => {
    if (!result) return "";
    
    switch (result) {
      case 'win':
        return "text-green-600 dark:text-green-400";
      case 'loss':
        return "text-red-600 dark:text-red-400";
      case 'draw':
        return "text-amber-600 dark:text-amber-400";
      default:
        return "";
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Aucun match</h3>
          <p className="text-muted-foreground mt-2">
            Vous n'avez pas encore ajouté de matchs pour votre équipe.
          </p>
        </div>
      ) : (
        <div className="border rounded-md dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">
                    {formatDate(game.date)}
                  </TableCell>
                  <TableCell>
                    {game.title}
                    {game.opponent && <div className="text-sm text-muted-foreground">vs {game.opponent}</div>}
                  </TableCell>
                  <TableCell>{game.location || "-"}</TableCell>
                  <TableCell>
                    {(game.team_score !== null && game.opponent_score !== null) ? (
                      <span className={cn("font-semibold", getResultClass(game.result))}>
                        {game.team_score} - {game.opponent_score}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{game.result ? getResultBadge(game.result) : "-"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onOpenStats(game.id)}>
                      <LineChart className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(game)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={gameToDelete === game.id} onOpenChange={(open) => !open && setGameToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => setGameToDelete(game.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce match ? Cette action ne peut pas être annulée et supprimera toutes les statistiques associées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setGameToDelete(null)}>
                            Annuler
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              onDelete(game.id);
                              setGameToDelete(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default GamesList;
