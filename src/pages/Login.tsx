import React from 'react';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/components/layout/AuthLayout';

const Login = () => {
  const { signIn } = useAuth();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15803d]"> 
    <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Connexion</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="Votre mot de passe"
            />
          </div>

          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Pas encore de compte?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;