import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle, RefreshCw, LogOut, Home, Store } from 'lucide-react';
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

  // Show loader while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Handle roles loading error
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

  // Not authenticated - redirect to appropriate login
  if (!user) {
    const isSellerRoute = location.pathname.startsWith('/ventas');
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    if (isSellerRoute) {
      return <Navigate to="/ventas/login" state={{ from: location }} replace />;
    }
    
    if (isAdminRoute) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Default fallback
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // While loading roles for an authenticated user
  if (!rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // User authenticated but missing admin role
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

  // User authenticated but missing seller role
  if (requiredRole === 'seller' && !isSeller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="border-green-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <Store className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-xl">No eres vendedor</CardTitle>
            <CardDescription>
              Para acceder al panel de vendedores, primero debes registrarte como vendedor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/ventas/registro')} 
              className="w-full bg-gradient-to-r from-green-600 to-green-500"
            >
              <Store className="h-4 w-4 mr-2" />
              Registrarme como Vendedor
            </Button>
            <Button variant="outline" onClick={() => navigate('/ventas')} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Portal Vendedores
            </Button>
            <Button 
              variant="ghost" 
              onClick={async () => {
                await signOut();
                navigate('/ventas/login', { replace: true });
              }} 
              className="w-full text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión e ingresar con otra cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required role - render children
  return <>{children}</>;
}
