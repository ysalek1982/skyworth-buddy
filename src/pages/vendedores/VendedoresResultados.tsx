import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Trophy, Calendar, Users, Gift, CheckCircle } from "lucide-react";
import SellerLayout from "@/components/layout/SellerLayout";
import { supabase } from "@/integrations/supabase/client";

interface CampaignData {
  name: string;
  draw_date: string;
  end_date: string;
}

interface Winner {
  code: string;
  owner_type: string;
  created_at: string;
}

const VendedoresResultados = () => {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalCoupons: 0,
    totalSales: 0,
    daysRemaining: 0,
  });
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active campaign from landing_settings
        const { data: landingData } = await supabase
          .from("landing_settings")
          .select("campaign_name, draw_date, campaign_end_date")
          .eq("is_active", true)
          .maybeSingle();

        if (landingData) {
          setCampaign({
            name: landingData.campaign_name,
            draw_date: landingData.draw_date,
            end_date: landingData.campaign_end_date
          });
          
          // Calculate days remaining
          const endDate = new Date(landingData.campaign_end_date);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setStats(prev => ({ ...prev, daysRemaining: Math.max(0, diffDays) }));
        }

        // Fetch statistics
        const { count: clientsCount } = await supabase
          .from("client_purchases")
          .select("*", { count: "exact", head: true });

        const { count: couponsCount } = await supabase
          .from("coupons")
          .select("*", { count: "exact", head: true });

        const { count: salesCount } = await supabase
          .from("seller_sales")
          .select("*", { count: "exact", head: true });

        setStats(prev => ({
          ...prev,
          totalParticipants: clientsCount || 0,
          totalCoupons: couponsCount || 0,
          totalSales: salesCount || 0,
        }));

        // Fetch recent draw results (if any)
        const { data: drawData } = await supabase
          .from("draws")
          .select("results")
          .order("executed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (drawData?.results) {
          // Parse winners from results
          const results = drawData.results as { winners?: Winner[] };
          setWinners(results.winners || []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number) => num.toLocaleString("es-BO");

  const statsDisplay = [
    { label: "Participantes", value: stats.totalParticipants, icon: Users, color: "text-blue-400" },
    { label: "Cupones Generados", value: stats.totalCoupons, icon: Gift, color: "text-orange-400" },
    { label: "Ventas Registradas", value: stats.totalSales, icon: Trophy, color: "text-green-400" },
    { label: "Días Restantes", value: stats.daysRemaining, icon: Calendar, color: "text-purple-400" },
  ];

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-foreground">Cargando resultados...</div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-orange shadow-glow-orange mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
              <span className="text-foreground">RESULTADOS </span>
              <span className="text-gradient-orange">CAMPAÑA</span>
            </h1>
            {campaign && (
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {campaign.name}
              </p>
            )}
          </motion.div>

          {/* Statistics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {statsDisplay.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-card rounded-2xl p-6 text-center shadow-card"
              >
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                <p className="text-3xl font-black text-card-foreground mb-1">
                  {formatNumber(stat.value)}
                </p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Winners Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl shadow-card overflow-hidden mb-8"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Ganadores del Sorteo
              </h2>
            </div>
            
            <div className="p-6">
              {winners.length > 0 ? (
                <div className="space-y-3">
                  {winners.map((winner, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                        <span className="text-skyworth-dark font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-card-foreground">{winner.code}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {winner.owner_type === "BUYER" ? "Comprador" : "Vendedor"}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold text-card-foreground mb-2">
                    Sorteo Pendiente
                  </h3>
                  <p className="text-muted-foreground">
                    Los ganadores se anunciarán después del sorteo.
                    {campaign?.draw_date && (
                      <span className="block mt-2 font-medium text-primary">
                        Fecha del sorteo: {new Date(campaign.draw_date).toLocaleDateString("es-BO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Prize Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl p-8 text-center border border-orange-500/20"
          >
            <Trophy className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-2xl font-black text-foreground uppercase mb-2">
              Premio Principal
            </h3>
            <p className="text-lg text-muted-foreground mb-4">
              5 Paquetes completos para ver a La Verde en el Repechaje
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 bg-card rounded-full text-card-foreground">
                ✈️ Pasajes Aéreos
              </span>
              <span className="px-4 py-2 bg-card rounded-full text-card-foreground">
                🏨 Hospedaje
              </span>
              <span className="px-4 py-2 bg-card rounded-full text-card-foreground">
                🎫 Entradas al Partido
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default VendedoresResultados;
