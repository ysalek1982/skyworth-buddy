import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star } from "lucide-react";
import SellerLayout from "@/components/layout/SellerLayout";
import { supabase } from "@/integrations/supabase/client";

const VendedoresRanking = () => {
  const [topSellers, setTopSellers] = useState<{ rank: number; name: string; store: string; city: string; points: number; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignInfo, setCampaignInfo] = useState<{ name: string; drawDate: string } | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      // Fetch campaign info from landing_settings
      const { data: landingData } = await supabase
        .from("landing_settings")
        .select("campaign_name, draw_date")
        .eq("is_active", true)
        .maybeSingle();

      if (landingData) {
        setCampaignInfo({
          name: landingData.campaign_name,
          drawDate: landingData.draw_date
        });
      }

      const { data: sellers, error } = await supabase
        .from("sellers")
        .select("id, user_id, store_name, store_city, total_points, total_sales")
        .eq("is_active", true)
        .order("total_points", { ascending: false })
        .limit(20);

      if (!error && sellers) {
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
            store: s.store_name,
            city: s.store_city,
            points: s.total_points,
            sales: s.total_sales,
          };
        });

        setTopSellers(formattedData);
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
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
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
        return "bg-muted/30 border-border";
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-foreground">Cargando rankings...</div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-gold shadow-glow-gold mb-4">
              <Trophy className="w-8 h-8 text-skyworth-dark" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
              <span className="text-foreground">RANKING </span>
              <span className="text-gradient-gold">VENDEDORES</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {campaignInfo?.name || "El Sueño del Hincha"} - Sorteo: {campaignInfo?.drawDate 
                ? new Date(campaignInfo.drawDate).toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" })
                : "Próximamente"}
            </p>
          </motion.div>

          {/* Empty State */}
          {topSellers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-card p-12 text-center"
            >
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-2">
                Aún no hay vendedores en el ranking
              </h3>
              <p className="text-muted-foreground">
                ¡Sé el primero en registrar ventas y aparecer aquí!
              </p>
            </motion.div>
          )}

          {/* Ranking List */}
          {topSellers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl shadow-card overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground">Tabla de Posiciones</h2>
              </div>

              <div className="divide-y divide-border">
                {topSellers.map((seller, index) => (
                  <motion.div
                    key={seller.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`p-4 flex items-center gap-4 ${getRankBg(seller.rank)} border-l-4`}
                  >
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(seller.rank)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-card-foreground truncate">{seller.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{seller.store} - {seller.city}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-4 h-4 fill-primary" />
                        <span className="font-bold">{seller.points}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{seller.sales} ventas</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
};

export default VendedoresRanking;
