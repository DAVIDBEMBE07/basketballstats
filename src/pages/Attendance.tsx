
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Composants refactorisés
import EventForm, { EventOption, eventFormSchema } from '@/components/attendance/EventForm';
import PlayerAttendanceList, { Player } from '@/components/attendance/PlayerAttendanceList';
import AttendanceHistory, { AttendanceRecord } from '@/components/attendance/AttendanceHistory';
import { Button } from '@/components/ui/button';

const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // États
  const [events, setEvents] = useState<EventOption[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerAttendance, setPlayerAttendance] = useState<Record<string, boolean>>({});
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  // Charger les données lors du chargement
  useEffect(() => {
    if (user) {
      loadEvents();
      loadPlayers();
      loadAttendanceHistory();
    }
  }, [user]);

  // Charger les événements depuis Supabase
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date
        }));
        
        setEvents(formattedEvents);
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

  // Charger les joueurs depuis Supabase
  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setPlayers(data);
        
        // Initialiser l'état des présences à false pour chaque joueur
        const initialAttendance: Record<string, boolean> = {};
        data.forEach(player => {
          initialAttendance[player.id] = false;
        });
        
        setPlayerAttendance(initialAttendance);
      }
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

  // Charger l'historique des présences
  const loadAttendanceHistory = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les données de présence
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, present, player_id, event_id')
        .eq('user_id', user?.id);
        
      if (attendanceError) throw attendanceError;
      
      // S'il n'y a pas de données, rien à traiter
      if (!attendanceData || attendanceData.length === 0) {
        setAttendanceRecords([]);
        setIsLoading(false);
        return;
      }
      
      // Récupérer les détails des joueurs
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('user_id', user?.id);
        
      if (playersError) throw playersError;
      
      // Récupérer les détails des événements
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date')
        .eq('user_id', user?.id);
        
      if (eventsError) throw eventsError;
      
      // Combiner les données
      const records: AttendanceRecord[] = attendanceData.map(record => {
        const player = playersData?.find(p => p.id === record.player_id);
        const event = eventsData?.find(e => e.id === record.event_id);
        
        return {
          id: record.id,
          eventId: record.event_id,
          eventTitle: event?.title || 'Événement inconnu',
          eventDate: event?.date || '',
          playerId: record.player_id,
          playerName: player?.name || 'Joueur inconnu',
          present: record.present
        };
      });
      
      setAttendanceRecords(records);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des présences.",
        variant: "destructive",
      });
      console.error("Error loading attendance history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les présences pour un événement spécifique
  const loadEventAttendance = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Réinitialiser les présences
      const resetAttendance: Record<string, boolean> = {};
      players.forEach(player => {
        resetAttendance[player.id] = false;
      });
      
      // Mettre à jour avec les données de la base
      if (data && data.length > 0) {
        data.forEach(record => {
          resetAttendance[record.player_id] = record.present;
        });
      }
      
      setPlayerAttendance(resetAttendance);
    } catch (error) {
      console.error("Error loading event attendance:", error);
    }
  };

  // Gérer le changement d'événement
  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      loadEventAttendance(eventId);
    }
  };

  // Créer un nouvel événement
  const createNewEvent = async (data: z.infer<typeof eventFormSchema>) => {
    try {
      if (!data.title) {
        toast({
          title: "Erreur",
          description: "Le titre de l'événement est requis.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      // Combiner date et heure
      const dateTime = new Date(data.date);
      if (data.time) {
        const [hours, minutes] = data.time.split(':').map(Number);
        dateTime.setHours(hours, minutes);
      }
      
      const { data: eventData, error } = await supabase
        .from('events')
        .insert({
          title: data.title,
          type: data.eventType,
          date: dateTime.toISOString(),
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      toast({
        title: "Événement créé",
        description: "L'événement a été créé avec succès.",
      });
      
      // Recharger les événements
      loadEvents();
      
      // Sélectionner le nouvel événement
      if (eventData) {
        setSelectedEvent({
          id: eventData.id,
          title: eventData.title,
          date: eventData.date
        });
        setIsCreatingEvent(false);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'événement.",
        variant: "destructive",
      });
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les présences
  const saveAttendance = async () => {
    if (!selectedEvent) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner un événement.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Pour chaque joueur, insérer ou mettre à jour son statut de présence
      for (const playerId of Object.keys(playerAttendance)) {
        // Vérifier si une entrée existe déjà
        const { data: existingData, error: fetchError } = await supabase
          .from('attendance')
          .select('*')
          .eq('event_id', selectedEvent.id)
          .eq('player_id', playerId)
          .eq('user_id', user?.id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        if (existingData) {
          // Mettre à jour
          const { error: updateError } = await supabase
            .from('attendance')
            .update({
              present: playerAttendance[playerId],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingData.id);
          
          if (updateError) throw updateError;
        } else {
          // Insérer nouvelle entrée
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              event_id: selectedEvent.id,
              player_id: playerId,
              user_id: user?.id,
              present: playerAttendance[playerId]
            });
          
          if (insertError) throw insertError;
        }
      }
      
      toast({
        title: "Présences sauvegardées",
        description: "Les présences ont été enregistrées avec succès.",
      });
      
      // Recharger l'historique
      loadAttendanceHistory();
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder les présences.",
        variant: "destructive",
      });
      console.error("Error saving attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement de présence
  const togglePresence = (playerId: string) => {
    setPlayerAttendance(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  // Toggler entre création et sélection d'événement
  const toggleCreateMode = () => {
    setIsCreatingEvent(!isCreatingEvent);
    setSelectedEvent(null);
  };

  const handleFormSubmit = (data: z.infer<typeof eventFormSchema>) => {
    if (isCreatingEvent) {
      createNewEvent(data);
    } else if (selectedEvent) {
      saveAttendance();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des présences</h1>
          <p className="text-muted-foreground">
            Suivez la présence des joueurs aux entraînements et aux matchs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire de sélection ou création d'événement */}
          <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {isCreatingEvent ? "Créer un événement" : "Sélectionner un événement"}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleCreateMode}
                >
                  {isCreatingEvent ? "Sélectionner" : "Nouvel événement"}
                </Button>
              </div>
              <CardDescription>
                {isCreatingEvent 
                  ? "Créez un nouvel événement pour marquer les présences."
                  : "Choisissez un événement pour marquer les présences."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm 
                events={events}
                isLoading={isLoading}
                isCreatingEvent={isCreatingEvent}
                selectedEvent={selectedEvent}
                onSubmit={handleFormSubmit}
                onEventChange={handleEventChange}
                onToggleCreateMode={toggleCreateMode}
              />
            </CardContent>
          </Card>

          {/* Liste de présence des joueurs */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Marquer les présences</CardTitle>
              <CardDescription>
                {selectedEvent 
                  ? `Présences pour "${selectedEvent.title}" le ${format(new Date(selectedEvent.date), "PPP à HH:mm", { locale: fr })}` 
                  : "Sélectionnez un événement pour marquer les présences"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerAttendanceList 
                players={players}
                playerAttendance={playerAttendance}
                selectedEvent={selectedEvent}
                isLoading={isLoading}
                onTogglePresence={togglePresence}
                onSaveAttendance={saveAttendance}
              />
            </CardContent>
          </Card>

          {/* Historique des présences */}
          <Card className="lg:col-span-3 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Historique des présences</CardTitle>
              <CardDescription>
                Consultez l'historique des présences de vos joueurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceHistory 
                attendanceRecords={attendanceRecords}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
