import { motion } from "framer-motion";
import { Trophy, Users, Ticket, Calendar, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Resultados = () => {
  // Estadísticas de ejemplo
  const stats = [
    { label: "Participantes", value: "12,450", icon: Users, color: "text-primary" },
    { label: "Tickets Emitidos", value: "28,340", icon: Ticket, color: "text-secondary" },
    { label: "Ventas Registradas", value: "8,920", icon: TrendingUp, color: "text-primary" },
    { label: "Días Restantes", value: "183", icon: Calendar, color: "text-secondary" },
  ];

  // Ganadores anteriores (simulados)
  const previousWinners = [
    { name: "Roberto Mendez", department: "Santa Cruz", prize: "TV 65\" OLED", date: "Enero 2026" },
    { name: "Patricia Quispe", department: "La Paz", prize: "Soundbar Premium", date: "Enero 2026" },
    { name: "Fernando García", department: "Cochabamba", prize: "TV 55\" 4K", date: "Diciembre 2025" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
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
              <span className="text-foreground">RESULTADOS DE LA</span>{" "}
              <span className="text-gradient-gold">CAMPAÑA</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Estadísticas en tiempo real y ganadores de la promoción
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-card rounded-2xl p-6 shadow-card text-center group hover:shadow-glow-gold transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-card-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Premio Principal */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl shadow-card overflow-hidden"
            >
              <div className="bg-gradient-gold p-6">
                <h2 className="text-xl font-black text-skyworth-dark uppercase flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Premio Principal
                </h2>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-6xl mb-4"
                  >
                    ⚽🏆
                  </motion.div>
                  <h3 className="text-2xl font-black text-card-foreground mb-2">
                    Viaje al Mundial 2026
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Vuelos + Hotel + Entradas + Gastos incluidos
                  </p>
                  <div className="bg-muted rounded-xl p-4 inline-block">
                    <p className="text-sm text-muted-foreground">Sorteo el</p>
                    <p className="text-xl font-bold text-gradient-gold">15 de Julio, 2026</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ganadores Mensuales */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl shadow-card overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground">Ganadores Recientes</h2>
                <p className="text-sm text-muted-foreground">Premios mensuales de la promoción</p>
              </div>
              <div className="divide-y divide-border">
                {previousWinners.map((winner, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-skyworth-dark" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-card-foreground">{winner.name}</p>
                      <p className="text-sm text-muted-foreground">{winner.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{winner.prize}</p>
                      <p className="text-xs text-muted-foreground">{winner.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 bg-muted/30">
                <p className="text-center text-sm text-muted-foreground">
                  ¡Tú podrías ser el próximo ganador!
                </p>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-card-blue rounded-2xl p-8 inline-block">
              <h3 className="text-xl font-bold text-foreground mb-2">¿Aún no participas?</h3>
              <p className="text-muted-foreground mb-4">
                Registra tu compra y obtén tus tickets para el gran sorteo
              </p>
              <a href="/registro-cliente" className="btn-cta-primary inline-flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Registrar Mi Compra
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Resultados;
