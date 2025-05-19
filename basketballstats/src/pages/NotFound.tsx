
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">Page non trouvée</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Désolé, nous n'avons pas pu trouver la page que vous recherchez.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
