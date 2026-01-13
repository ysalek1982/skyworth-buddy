import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Rankings = () => {
  // Datos de ejemplo para el ranking
  const topSellers = [
    { rank: 1, name: "María García", store: "Tienda Central La Paz", points: 2850, sales: 47 },
    { rank: 2, name: "Carlos López", store: "Tienda Santa Cruz Norte", points: 2340, sales: 39 },
    { rank: 3, name: "Ana Rodríguez", store: "Tienda Cochabamba Centro", points: 2100, sales: 35 },
    { rank: 4, name: "Juan Mamani", store: "Tienda El Alto", points: 1890, sales: 31 },
    { rank: 5, name: "Rosa Quispe", store: "Tienda Oruro", points: 1650, sales: 27 },
    { rank: 6, name: "Pedro Flores", store: "Tienda Potosí", points: 1420, sales: 24 },
    { rank: 7, name: "Lucia Mendoza", store: "Tienda Sucre", points: 1280, sales: 21 },
    { rank: 8, name: "Diego Vargas", store: "Tienda Tarija", points: 1100, sales: 18 },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
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
            <h1 className="text-3xl md:text-4xl font-black uppercase mb-4">
              <span className="text-foreground">RANKING DE</span>{" "}
              <span className="text-gradient-gold">VENDEDORES</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Los mejores vendedores de la campaña Skyworth Mundial 2026
            </p>
          </motion.div>

          {/* Top 3 Podium */}
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
              <div className="bg-gray-500/20 rounded-t-xl pt-4 pb-8 px-4 w-32">
                <p className="font-bold text-foreground text-sm truncate">{topSellers[1]?.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{topSellers[1]?.points} pts</p>
                <div className="text-2xl font-black text-gray-400">2°</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center -mt-8">
              <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow-gold">
                <Trophy className="w-12 h-12 text-skyworth-dark" />
              </div>
              <div className="bg-primary/20 rounded-t-xl pt-4 pb-12 px-4 w-36">
                <p className="font-bold text-foreground text-sm truncate">{topSellers[0]?.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{topSellers[0]?.points} pts</p>
                <div className="text-3xl font-black text-gradient-gold">1°</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div className="bg-amber-600/20 rounded-t-xl pt-4 pb-6 px-4 w-32">
                <p className="font-bold text-foreground text-sm truncate">{topSellers[2]?.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{topSellers[2]?.points} pts</p>
                <div className="text-2xl font-black text-amber-500">3°</div>
              </div>
            </div>
          </motion.div>

          {/* Full Ranking List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 flex items-center gap-4 ${getRankBg(seller.rank)} border-l-4`}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(seller.rank)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-card-foreground truncate">{seller.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{seller.store}</p>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Rankings;
