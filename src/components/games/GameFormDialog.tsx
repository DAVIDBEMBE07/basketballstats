
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Game } from '@/types/gameTypes';

const gameFormSchema = z.object({
  title: z.string().min(2, {
    message: "Le titre doit contenir au moins 2 caractères.",
  }),
  date: z.date({
    required_error: "La date est requise.",
  }),
  location: z.string().optional(),
  opponent: z.string().optional(),
  team_score: z.union([
    z.number().int().nonnegative().optional(),
    z.string().transform((val) => {
      if (val === "") return undefined;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }).optional()
  ]),
  opponent_score: z.union([
    z.number().int().nonnegative().optional(),
    z.string().transform((val) => {
      if (val === "") return undefined;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }).optional()
  ]),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

interface GameFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingGame: Game | null;
  onGameSaved: () => void;
}

const GameFormDialog: React.FC<GameFormDialogProps> = ({
  isOpen,
  onClose,
  editingGame,
  onGameSaved,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      location: "",
      opponent: "",
      team_score: undefined,
      opponent_score: undefined,
    },
  });

  useEffect(() => {
    if (editingGame) {
      form.reset({
        title: editingGame.title,
        date: new Date(editingGame.date),
        location: editingGame.location || "",
        opponent: editingGame.opponent || "",
        team_score: editingGame.team_score || undefined,
        opponent_score: editingGame.opponent_score || undefined,
      });
    } else {
      form.reset({
        title: "",
        date: new Date(),
        location: "",
        opponent: "",
        team_score: undefined,
        opponent_score: undefined,
      });
    }
  }, [editingGame, form]);

  const onSubmit = async (values: GameFormValues) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Déterminer le résultat du match (Victoire, Défaite, Égalité)
      let result = null;
      if (values.team_score !== undefined && values.opponent_score !== undefined) {
        if (values.team_score > values.opponent_score) {
          result = 'win';
        } else if (values.team_score < values.opponent_score) {
          result = 'loss';
        } else {
          result = 'draw';
        }
      }
      
      const gameData = {
        title: values.title,
        date: values.date.toISOString(),
        location: values.location || null,
        opponent: values.opponent || null,
        team_score: values.team_score ?? null,
        opponent_score: values.opponent_score ?? null,
        result,
        type: 'game', // Indique que c'est un match
        user_id: user.id,
      };
      
      if (editingGame) {
        // Mise à jour d'un match existant
        const { error } = await supabase
          .from('events')
          .update(gameData)
          .eq('id', editingGame.id);
        
        if (error) throw error;
        
        toast({
          title: "Match mis à jour",
          description: "Les informations du match ont été mises à jour avec succès.",
        });
      } else {
        // Ajout d'un nouveau match
        const { error } = await supabase
          .from('events')
          .insert(gameData);
        
        if (error) throw error;
        
        toast({
          title: "Match ajouté",
          description: "Le match a été ajouté avec succès.",
        });
      }
      
      // Fermer le dialogue et rafraîchir la liste
      onClose();
      onGameSaved();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingGame ? "Modifier le match" : "Ajouter un match"}
          </DialogTitle>
          <DialogDescription>
            {editingGame 
              ? "Modifiez les détails du match ci-dessous." 
              : "Ajoutez un nouveau match pour votre équipe."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du match</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Match contre Équipe A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu</FormLabel>
                    <FormControl>
                      <Input placeholder="Lieu du match" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adversaire</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'équipe adverse" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="team_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score de notre équipe</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Score" 
                        {...field} 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="opponent_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score de l'adversaire</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Score" 
                        {...field} 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : (editingGame ? "Mettre à jour" : "Ajouter")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GameFormDialog;
