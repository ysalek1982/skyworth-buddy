import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plane, Hotel, Ticket, Sparkles } from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { supabase } from "@/integrations/supabase/client";
import stadiumBg from "@/assets/stadium-bg.jpg";

const HeroSection = () => {
  const [sorteoDate, setSorteoDate] = useState<Date>(new Date("2026-07-15T20:00:00"));

  useEffect(() => {
    const fetchCampaign = async () => {
      const { data } = await supabase
        .from("campaign")
        .select("name, draw_date")
        .eq("is_active", true)
        .maybeSingle();

      if (data?.draw_date) {
        setSorteoDate(new Date(data.draw_date));
      }
    };

    fetchCampaign();
  }, []);

  const scrollToRegister = () => {
    const element = document.getElementById("registrar-compra");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden hero-stadium-enhanced"
      style={{ backgroundImage: `url(${stadiumBg})` }}
    >
      {/* Enhanced overlay with green tint for "cancha" feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#071A2E]/80 via-[#0B2A4A]/60 to-[#071A2E]/90" />
      
      {/* Stadium lights effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
      
      {/* Confetti/sparkles decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF6A00' : '#22C55E',
              opacity: 0.3,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Field lines decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-20 border-2 border-green-500/20 rounded-t-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-6"
        >
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Campaña Oficial Skyworth Bolivia</span>
        </motion.div>

        {/* Main Title - El Sueño del Hincha */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-wider text-white drop-shadow-2xl leading-tight">
            EL SUEÑO DEL HINCHA
            <span className="block text-3xl md:text-4xl lg:text-5xl text-gradient-orange mt-2">SKYWORTH</span>
          </h1>
        </motion.div>

        {/* Subtitle copy - Updated */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-medium"
        >
          Gánate <span className="text-yellow-400 font-bold">1 viaje a Monterrey</span> para alentar a La Verde en el repechaje
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <button onClick={scrollToRegister} className="btn-cta-primary inline-flex items-center gap-3 shadow-glow-orange animate-pulse-glow">
            <Trophy className="w-6 h-6" />
            REGISTRAR COMPRA
          </button>
        </motion.div>

        {/* Prize Card - White */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="prize-card max-w-4xl mx-auto mb-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="prize-number">5</div>
            <div className="flex-1 text-left">
              <h3 className="text-2xl md:text-4xl font-black uppercase text-[#0B6FBF] leading-tight mb-2">
                PAQUETES COMPLETOS
              </h3>
              <p className="text-lg md:text-xl text-[#0B2A4A] font-medium">
                para ver y alentar a la <span className="font-bold">Selección Boliviana</span> en el{" "}
                <span className="font-black text-[#FF6A00]">REPECHAJE!</span>
              </p>
            </div>
          </div>

          {/* Premio incluye */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-sm uppercase tracking-widest text-gray-500 mb-6 font-bold">
              El Premio Incluye:
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="icon-circle">
                  <Plane className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-[#0B2A4A] uppercase">Pasajes Aéreos</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="icon-circle">
                  <Hotel className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-[#0B2A4A] uppercase">Hospedaje</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="icon-circle">
                  <Ticket className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-[#0B2A4A] uppercase">Entradas al Partido</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white/70 text-sm uppercase tracking-widest mb-4">Tiempo restante para el sorteo</p>
          <CountdownTimer targetDate={sorteoDate} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
