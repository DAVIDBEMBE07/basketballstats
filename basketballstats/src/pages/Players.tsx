
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Player {
  id: string;
  name: string;
  position: string | null;
  jersey_number: number | null;
  created_at: string;
}

const playerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom du joueur doit contenir au moins 2 caractères.",
  }),
  position: z.string().optional(),
  jersey_number: z.union([
    z.number().int().positive().optional(),
    z.string().transform((val) => {
      if (val === "") return undefined;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }).optional()
  ]),
});

type PlayerFormValues = z.infer<typeof playerFormSchema>;

const Players = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      position: "",
      jersey_number: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      loadPlayers();
    }
  }, [user]);

  useEffect(() => {
    if (editingPlayer) {
      form.reset({
        name: editingPlayer.name,
        position: editingPlayer.position || "",
        jersey_number: editingPlayer.jersey_number || undefined,
      });
    } else {
      form.reset({
        name: "",
        position: "",
        jersey_number: undefined,
      });
    }
  }, [editingPlayer, form]);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setPlayers(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les joueurs.",
        variant: "destructive",
      });
      console.error("Error loading players:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingPlayer(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setIsDialogOpen(true);
  };

  const confirmDelete = (playerId: string) => {
    setPlayerToDelete(playerId);
    setIsDeleteDialogOpen(true);
  };

  const deletePlayer = async () => {
    if (!playerToDelete) return;
    
    try {
      // Supprimer d'abord les statistiques du joueur
      await supabase
        .from('statistics')
        .delete()
        .eq('player_id', playerToDelete);
      
      // Supprimer ensuite les présences du joueur
      await supabase
        .from('attendance')
        .delete()
        .eq('player_id', playerToDelete);
      
      // Finalement, supprimer le joueur
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerToDelete);
      
      if (error) throw error;
      
      setPlayers(prev => prev.filter(player => player.id !== playerToDelete));
      
      toast({
        title: "Joueur supprimé",
        description: "Le joueur et toutes ses données associées ont été supprimés avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer le joueur.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  const onSubmit = async (values: PlayerFormValues) => {
    try {
      if (editingPlayer) {
        // Mise à jour d'un joueur existant
        const { error } = await supabase
          .from('players')
          .update({
            name: values.name,
            position: values.position || null,
            jersey_number: values.jersey_number || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlayer.id);
        
        if (error) throw error;
        
        setPlayers(prev => prev.map(player => 
          player.id === editingPlayer.id 
            ? { ...player, name: values.name, position: values.position || null, jersey_number: values.jersey_number || null } 
            : player
        ));
        
        toast({
          title: "Joueur mis à jour",
          description: "Les informations du joueur ont été mises à jour avec succès.",
        });
      } else {
        // Ajout d'un nouveau joueur
        const { data, error } = await supabase
          .from('players')
          .insert({
            name: values.name,
            position: values.position || null,
            jersey_number: values.jersey_number || null,
            user_id: user?.id,
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setPlayers(prev => [...prev, data[0]]);
        }
        
        toast({
          title: "Joueur ajouté",
          description: "Le joueur a été ajouté avec succès à l'équipe.",
        });
      }
      
      // Fermer le dialogue et réinitialiser le formulaire
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'opération.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Joueurs</h1>
            <p className="text-muted-foreground">
              Ajoutez et gérez les joueurs de votre équipe.
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un joueur
          </Button>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Liste des joueurs</CardTitle>
            <CardDescription>
              Tous les joueurs enregistrés dans votre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">Aucun joueur</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Vous n'avez pas encore ajouté de joueurs à votre équipe.
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter votre premier joueur
                </Button>
              </div>
            ) : (
              <div className="border rounded-md dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom du joueur</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.position || "-"}</TableCell>
                        <TableCell>{player.jersey_number || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(player)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => confirmDelete(player.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogue pour ajouter/modifier un joueur */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? "Modifier le joueur" : "Ajouter un joueur"}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer 
                ? "Modifiez les informations du joueur ci-dessous." 
                : "Ajoutez un nouveau joueur à votre équipe."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du joueur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet du joueur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Position du joueur (optionnel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="jersey_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de maillot</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Numéro de maillot (optionnel)" 
                        {...field} 
                        value={field.value || ''} 
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingPlayer ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement le joueur et toutes les données associées (statistiques, présences, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
};

export default Players;
