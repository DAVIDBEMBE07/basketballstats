import React from 'react';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SignUp = () => {
  const { signUp } = useAuth();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      await signUp(data.email, data.password, data.username);
    } catch (error) {
      console.error("Erreur d'inscription:", error);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-[#15803d]"> {/* Changement ici */}
    <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Inscription</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
            <Input 
              {...register("username")} 
              placeholder="Votre nom d'utilisateur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input 
              type="email" 
              {...register("email")} 
              placeholder="votreemail@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <Input 
              type="password" 
              {...register("password")} 
              placeholder="Créez un mot de passe"
            />
          </div>

          <Button type="submit" className="w-full">
            S'inscrire
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Déjà un compte?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;