import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import stadiumBg from "@/assets/stadium-bg.jpg";

interface Vendedor {
  id: string;
  user_id: string;
  tienda: string;
  puntos_acumulados: number;
  ventas_totales: number;
  profiles?: {
    nombre: string;
    apellido: string;
  };
}

const Rankings = () => {
  const [topSellers, setTopSellers] = useState<{ rank: number; name: string; store: string; points: number; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      // First try the new sellers table
      const { data: sellers, error: sellersError } = await supabase
        .from("sellers")
        .select("id, user_id, store_name, store_city, total_points, total_sales")
        .eq("is_active", true)
        .order("total_points", { ascending: false })
        .limit(10);

      if (!sellersError && sellers && sellers.length > 0) {
        // Fetch profiles for sellers
        const userIds = sellers.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nombre, apellido")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedData = sellers.map((s, index) => {
          const profile = profileMap.get(s.user_id);
          return {
            rank: index + 1,
            name: profile ? `${profile.nombre} ${profile.apellido}` : "Vendedor",
            store: `${s.store_name} - ${s.store_city}`,
            points: s.total_points,
            sales: s.total_sales,
          };
        });

        setTopSellers(formattedData);
        setLoading(false);
        return;
      }

      // Fallback to vendedores table
      const { data: vendedores, error } = await supabase
        .from("vendedores")
        .select("id, user_id, tienda, puntos_acumulados, ventas_totales")
        .eq("estado", "activo")
        .order("puntos_acumulados", { ascending: false })
        .limit(10);

      if (!error && vendedores && vendedores.length > 0) {
        const userIds = vendedores.map(v => v.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nombre, apellido")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedData = vendedores.map((v, index) => {
          const profile = profileMap.get(v.user_id);
          return {
            rank: index + 1,
            name: profile ? `${profile.nombre} ${profile.apellido}` : "Vendedor",
            store: v.tienda,
            points: v.puntos_acumulados,
            sales: v.ventas_totales,
          };
        });

        setTopSellers(formattedData);
      } else {
        // No data available - show empty state
        setTopSellers([]);
      }

      setLoading(false);
    };

    fetchRankings();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-white/50">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white">Cargando rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #071A2E 0%, #0B2A4A 50%, #071A2E 100%)' }}>
      <Header />
      
      <main className="main-content pb-12 px-4">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-orange shadow-glow-orange mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
              <span className="text-white">RANKING DE </span>
              <span className="text-gradient-orange">VENDEDORES</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Los mejores vendedores del Sueño del Hincha - Repechaje Bolivia rumbo a México 2026
            </p>
          </motion.div>

          {/* Top 3 Podium */}
          {topSellers.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center items-end gap-4 mb-12"
            >
              {/* 2nd Place */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
                  <Medal className="w-10 h-10 text-white" />
                </div>
                <div className="bg-gray-500/20 rounded-t-xl pt-4 pb-8 px-4 w-32 border border-gray-400/20">
                  <p className="font-bold text-white text-sm truncate">{topSellers[1]?.name}</p>
                  <p className="text-xs text-white/60 mb-2">{topSellers[1]?.points} pts</p>
                  <div className="text-2xl font-black text-gray-400">2°</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center -mt-8">
                <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-gradient-orange flex items-center justify-center shadow-glow-orange">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="bg-[#FF6A00]/20 rounded-t-xl pt-4 pb-12 px-4 w-36 border border-[#FF6A00]/30">
                  <p className="font-bold text-white text-sm truncate">{topSellers[0]?.name}</p>
                  <p className="text-xs text-white/60 mb-2">{topSellers[0]?.points} pts</p>
                  <div className="text-3xl font-black text-gradient-orange">1°</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="bg-amber-600/20 rounded-t-xl pt-4 pb-6 px-4 w-32 border border-amber-600/20">
                  <p className="font-bold text-white text-sm truncate">{topSellers[2]?.name}</p>
                  <p className="text-xs text-white/60 mb-2">{topSellers[2]?.points} pts</p>
                  <div className="text-2xl font-black text-amber-500">3°</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {topSellers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-dark rounded-2xl p-12 text-center mb-8"
            >
              <Trophy className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Aún no hay vendedores en el ranking
              </h3>
              <p className="text-white/60">
                ¡Sé el primero en registrar ventas y aparecer aquí!
              </p>
            </motion.div>
          )}

          {/* Full Ranking List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Tabla de Posiciones</h2>
            </div>

            <div className="divide-y divide-white/10">
              {topSellers.map((seller, index) => (
                <motion.div
                  key={seller.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 flex items-center gap-4 ${getRankBg(seller.rank)} border-l-4`}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(seller.rank)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{seller.name}</p>
                    <p className="text-sm text-white/50 truncate">{seller.store}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#FF6A00]">
                      <Star className="w-4 h-4 fill-[#FF6A00]" />
                      <span className="font-bold">{seller.points}</span>
                    </div>
                    <p className="text-xs text-white/50">{seller.sales} ventas</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Rankings;
