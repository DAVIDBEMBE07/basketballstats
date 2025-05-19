
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Plus, MapPin, Edit, Trash2, CalendarClock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Schéma de validation pour le formulaire d'événement
const eventFormSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit avoir au moins 3 caractères.",
  }),
  type: z.string({
    required_error: "Veuillez sélectionner un type d'événement.",
  }),
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  location: z.string().optional(),
  opponent: z.string().optional(),
});

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  opponent: string | null;
}

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Formulaire
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      type: "training",
      date: new Date(),
      location: "",
      opponent: "",
    },
  });

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setEvents(data as Event[]);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements.",
        variant: "destructive",
      });
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = (date?: Date) => {
    setEditingEvent(null);
    form.reset({
      title: "",
      type: "training",
      date: date || new Date(),
      location: "",
      opponent: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      type: event.type,
      date: new Date(event.date),
      location: event.location || "",
      opponent: event.opponent || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof eventFormSchema>) => {
    try {
      if (editingEvent) {
        // Mise à jour d'un événement existant
        const { error } = await supabase
          .from('events')
          .update({
            title: data.title,
            type: data.type,
            date: data.date.toISOString(),
            location: data.location || null,
            opponent: data.opponent || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        
        toast({
          title: "Événement mis à jour",
          description: `"${data.title}" a été mis à jour avec succès.`,
        });
      } else {
        // Création d'un nouvel événement
        const { error } = await supabase
          .from('events')
          .insert({
            title: data.title,
            type: data.type,
            date: data.date.toISOString(),
            location: data.location || null,
            opponent: data.opponent || null,
            user_id: user?.id,
          });
        
        if (error) throw error;
        
        toast({
          title: "Événement créé",
          description: `"${data.title}" a été ajouté au calendrier.`,
        });
      }
      
      // Fermer la boîte de dialogue et recharger les événements
      setIsDialogOpen(false);
      loadEvents();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'enregistrement de l'événement.",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
      
      loadEvents();
    } catch (error: any) {
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    }
  };

  // Fonction pour grouper les événements par date
  const groupEventsByDate = () => {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByDate();

  // Date actuelle pour le calendrier
  const today = new Date();

  // Dates avec événements pour le calendrier
  const datesWithEvents = React.useMemo(() => {
    return events.map(event => new Date(event.date));
  }, [events]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
            <p className="text-muted-foreground">
              Gérez vos entraînements et matchs à venir.
            </p>
          </div>
          <Button onClick={() => openAddDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un événement
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendrier</CardTitle>
              <CardDescription>
                Sélectionnez une date pour voir ou ajouter des événements.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={fr}
                modifiers={{
                  booked: datesWithEvents
                }}
                modifiersClassNames={{
                  booked: "bg-primary/10 font-bold"
                }}
                components={{
                  DayContent: (props) => {
                    // Formatter la date au format yyyy-MM-dd pour comparer avec les clés groupées
                    const formattedDate = format(props.date, 'yyyy-MM-dd');
                    const hasEvents = groupedEvents[formattedDate]?.length > 0;
                    return (
                      <div className={`relative ${hasEvents ? 'font-bold' : ''}`}>
                        {format(props.date, 'd')}
                        {hasEvents && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => selectedDate && openAddDialog(selectedDate)}
              >
                <Plus className="mr-2 h-4 w-4" /> 
                Ajouter un événement
                {selectedDate ? ` le ${format(selectedDate, 'PPP', { locale: fr })}` : ''}
              </Button>
            </CardFooter>
          </Card>

          {/* Liste d'événements */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Événements</CardTitle>
              <CardDescription>
                Tous vos entraînements et matchs à venir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Chargement des événements...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Aucun événement programmé
                  </h3>
                  <p className="text-muted-foreground">
                    Créez votre premier événement en cliquant sur "Ajouter un événement".
                  </p>
                </div>
              ) : (
                Object.entries(groupedEvents)
                  .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                  .map(([dateKey, dateEvents]) => (
                    <div key={dateKey} className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                        {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
                      </h3>
                      
                      <div className="space-y-3">
                        {dateEvents.map((event) => (
                          <Card key={event.id} className="overflow-hidden">
                            <div className={cn(
                              "h-2",
                              event.type === 'training' ? "bg-blue-500" : "bg-orange-500"
                            )} />
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-base">{event.title}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <span className={cn(
                                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                      event.type === 'training' 
                                        ? "bg-blue-100 text-blue-800" 
                                        : "bg-orange-100 text-orange-800"
                                    )}>
                                      {event.type === 'training' ? 'Entraînement' : 'Match'}
                                    </span>
                                    <span>•</span>
                                    <span>{format(new Date(event.date), 'HH:mm', { locale: fr })}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  {event.opponent && event.type === 'game' && (
                                    <div className="text-sm mt-1">
                                      <span className="text-muted-foreground">Adversaire:</span> {event.opponent}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => openEditDialog(event)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => deleteEvent(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog pour ajouter/modifier un événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Modifier l'événement" : "Ajouter un événement"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? "Modifiez les détails de l'événement ci-dessous." 
                : "Remplissez les informations pour créer un nouvel événement."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de l'événement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="training">Entraînement</SelectItem>
                        <SelectItem value="game">Match</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date et heure</FormLabel>
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
                              format(field.value, "PPP 'à' HH:mm", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            // Conserver l'heure actuelle lors du changement de date
                            if (date) {
                              const currentTime = field.value || new Date();
                              date.setHours(currentTime.getHours());
                              date.setMinutes(currentTime.getMinutes());
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                          locale={fr}
                        />
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(field.value);
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              field.onChange(newDate);
                            }}
                            defaultValue={format(field.value || new Date(), 'HH:mm')}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Gymnase, terrain..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('type') === 'game' && (
                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adversaire (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'équipe adverse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingEvent ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Calendar;
