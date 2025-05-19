
import React from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  playerName: string;
  playerId: string;
  present: boolean;
}

interface AttendanceHistoryProps {
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
}

const AttendanceHistory = ({ attendanceRecords, isLoading }: AttendanceHistoryProps) => {
  if (isLoading) {
    return (
      <div className="border rounded-md dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Joueur</TableHead>
              <TableHead className="w-[250px]">Événement</TableHead>
              <TableHead>Date et heure</TableHead>
              <TableHead className="text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-md dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Joueur</TableHead>
            <TableHead className="w-[250px]">Événement</TableHead>
            <TableHead>Date et heure</TableHead>
            <TableHead className="text-right">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.length > 0 ? (
            attendanceRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.playerName}</TableCell>
                <TableCell>{record.eventTitle}</TableCell>
                <TableCell>{format(new Date(record.eventDate), "PPP à HH:mm", { locale: fr })}</TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    record.present 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  )}>
                    {record.present ? 'Présent' : 'Absent'}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Aucun historique de présence. Commencez à enregistrer des présences.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceHistory;
