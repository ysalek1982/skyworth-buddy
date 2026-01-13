import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle, RefreshCw, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, rolesLoaded, rolesError, isAdmin, isSeller, signOut, refreshRoles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || !rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (rolesError && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-destructive/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Error técnico</CardTitle>
            <CardDescription>{rolesError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => refreshRoles()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate('/', { replace: true });
              }}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    const fullPath = location.pathname + location.search;
    const redirectPath = encodeURIComponent(fullPath.replace(/^\//, ''));
    return <Navigate to={`/login?redirect=${redirectPath}`} state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-amber-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Acceso denegado</CardTitle>
            <CardDescription>No tienes permisos de administrador.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate('/', { replace: true })} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredRole === 'seller' && !isSeller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-green-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">No eres vendedor</CardTitle>
            <CardDescription>Regístrate como vendedor para acceder.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate('/registro-vendedor')} className="w-full">
              Registrarme como Vendedor
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
