import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plane, Hotel, Ticket } from "lucide-react";
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
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden hero-stadium"
      style={{ backgroundImage: `url(${stadiumBg})` }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#071A2E]/95 via-[#0B2A4A]/80 to-[#071A2E]/95" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Main Title - El Sueño del Hincha */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-wider text-white drop-shadow-2xl">
            EL SUEÑO DEL HINCHA
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-1 w-20 bg-gradient-orange rounded" />
            <span className="text-xl md:text-2xl font-bold text-white/90 uppercase tracking-widest">
              SKYWORTH
            </span>
            <div className="h-1 w-20 bg-gradient-orange rounded" />
          </div>
        </motion.div>

        {/* Subtitle copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto uppercase tracking-wide font-medium"
        >
          COMPRA TU TV SKYWORTH, REGISTRA TU COMPRA Y PARTICIPA POR INCREÍBLES PREMIOS.
          <br />
          <span className="text-gradient-orange font-bold">¡TU BOLETO AL REPECHAJE TE ESPERA!</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <button onClick={scrollToRegister} className="btn-cta-primary inline-flex items-center gap-3 shadow-glow-orange">
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
                <span className="font-black text-[#FF6A00]">REPECHAJE MUNDIALISTA!</span>
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
