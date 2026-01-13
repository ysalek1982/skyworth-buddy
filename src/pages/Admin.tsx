import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Package, 
  Barcode, 
  Ticket, 
  ShoppingCart, 
  Users, 
  Trophy, 
  BookOpen, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminSerials from '@/components/admin/AdminSerials';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminPurchases from '@/components/admin/AdminPurchases';
import AdminSellers from '@/components/admin/AdminSellers';
import AdminDraw from '@/components/admin/AdminDraw';
import AdminKnowledgeBase from '@/components/admin/AdminKnowledgeBase';
import AdminSettings from '@/components/admin/AdminSettings';

const tabs = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'products', label: 'Productos', icon: Package },
  { value: 'serials', label: 'Seriales', icon: Barcode },
  { value: 'coupons', label: 'Cupones', icon: Ticket },
  { value: 'purchases', label: 'Compras', icon: ShoppingCart },
  { value: 'sellers', label: 'Vendedores', icon: Users },
  { value: 'draw', label: 'Sorteo', icon: Trophy },
  { value: 'knowledge', label: 'Base de Conocimientos', icon: BookOpen },
  { value: 'settings', label: 'Configuración', icon: Settings },
];

function AdminContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'products':
        return <AdminProducts />;
      case 'serials':
        return <AdminSerials />;
      case 'coupons':
        return <AdminCoupons />;
      case 'purchases':
        return <AdminPurchases />;
      case 'sellers':
        return <AdminSellers />;
      case 'draw':
        return <AdminDraw />;
      case 'knowledge':
        return <AdminKnowledgeBase />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">Panel Admin</h2>
                </div>
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.value
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-foreground">
              Skyworth Admin
            </h1>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Volver al sitio
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 min-h-[calc(100vh-73px)] bg-card border-r border-border">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminContent />
    </ProtectedRoute>
  );
}
