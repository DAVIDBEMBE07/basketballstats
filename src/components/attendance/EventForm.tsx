
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Schéma de validation pour le formulaire d'événement
export const eventFormSchema = z.object({
  eventId: z.string({
    required_error: "Veuillez sélectionner un événement.",
  }).optional(),
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  time: z.string().optional(),
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères").optional(),
  eventType: z.enum(["training", "game"]).default("training"),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

export interface EventOption {
  id: string;
  title: string;
  date: string;
}

interface EventFormProps {
  events: EventOption[];
  isLoading: boolean;
  isCreatingEvent: boolean;
  selectedEvent: EventOption | null;
  onSubmit: (data: EventFormData) => void;
  onEventChange: (eventId: string) => void;
  onToggleCreateMode: () => void;
}

const EventForm = ({
  events,
  isLoading,
  isCreatingEvent,
  selectedEvent,
  onSubmit,
  onEventChange,
  onToggleCreateMode
}: EventFormProps) => {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      date: new Date(),
      time: '18:00',
      eventType: "training",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (!isCreatingEvent && events.length === 0) ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Aucun événement disponible.</p>
          <Button 
            className="mt-2"
            onClick={onToggleCreateMode}
          >
            Créer un événement
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isCreatingEvent ? (
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Événement</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        onEventChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un événement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {format(new Date(event.date), "Pp", { locale: fr })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de l'événement</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Entraînement du lundi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'événement</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!isCreatingEvent}
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
                          disabled={!isCreatingEvent && !selectedEvent}
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
                        disabled={!isCreatingEvent && !selectedEvent}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure</FormLabel>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        disabled={!isCreatingEvent && !selectedEvent}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isCreatingEvent && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                Créer l'événement
              </Button>
            )}
          </form>
        </Form>
      )}
    </>
  );
};

export default EventForm;
