'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Lock, User, Eye, EyeOff, ChefHat, UtensilsCrossed, Building2, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Error de autenticación');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
      
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Brand section with improved typography */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-xl shadow-xl mb-3 transform hover:scale-105 transition-transform duration-300">
            <ChefHat className="h-7 w-7 text-white drop-shadow-sm" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-primary via-primary/90 to-secondary bg-clip-text text-transparent mb-1 tracking-tight">
            Restaurante
          </h1>
          <p className="text-slate-600 text-sm font-medium">Sistema de Gestión Integral</p>
          <div className="w-10 h-0.5 bg-gradient-to-r from-primary to-secondary mx-auto mt-1 rounded-full"></div>
        </div>

        {/* Enhanced Login Card */}
        <Card className="w-full bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-secondary"></div>
          
          <CardHeader className="text-center pb-4 pt-6">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-lg font-bold text-slate-800 mb-1">Iniciar Sesión</CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Acceda a su panel de administración
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-semibold text-xs uppercase tracking-wide">
                  Usuario
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su nombre de usuario"
                    required
                    disabled={isLoading}
                    className="pl-10 h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-500 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-xs uppercase tracking-wide">
                  Contraseña
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10 h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-500 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-lg py-2">
                  <AlertDescription className="text-red-700 font-medium text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Enhanced footer */}
            <div className="text-center pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                Plataforma de gestión empresarial
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 