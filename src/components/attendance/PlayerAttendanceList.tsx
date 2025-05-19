
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventOption } from './EventForm';

export interface Player {
  id: string;
  name: string;
}

interface PlayerAttendanceListProps {
  players: Player[];
  playerAttendance: Record<string, boolean>;
  selectedEvent: EventOption | null;
  isLoading: boolean;
  onTogglePresence: (playerId: string) => void;
  onSaveAttendance: () => void;
}

const PlayerAttendanceList = ({
  players,
  playerAttendance,
  selectedEvent,
  isLoading,
  onTogglePresence,
  onSaveAttendance
}: PlayerAttendanceListProps) => {
  if (isLoading) {
    return (
      <div className="border rounded-md dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nom du joueur</TableHead>
              <TableHead className="text-right">Présent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-6 w-10 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center dark:border-gray-700">
        <p className="text-muted-foreground mb-2">
          Aucun joueur trouvé. Ajoutez des joueurs dans la section "Joueurs".
        </p>
        <Button asChild>
          <a href="/players">Ajouter des joueurs</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nom du joueur</TableHead>
              <TableHead className="text-right">Présent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell className="text-right">
                  <Switch 
                    checked={playerAttendance[player.id] || false}
                    onCheckedChange={() => onTogglePresence(player.id)}
                    disabled={!selectedEvent}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mt-4">
        <Button 
          onClick={onSaveAttendance}
          disabled={!selectedEvent || players.length === 0}
        >
          Enregistrer les présences
        </Button>
      </div>
    </>
  );
};

export default PlayerAttendanceList;
