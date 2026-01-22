import { motion } from "framer-motion";
import { Trophy, Plane, Hotel, Ticket, Sparkles, Calendar } from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { useLandingSettings, getDaysUntilDraw, formatDrawDate } from "@/hooks/useLandingSettings";
import { Skeleton } from "@/components/ui/skeleton";

// Football ball SVG component
const FootballIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white" opacity="0.3"/>
    <path d="M12 6l-1.5 2.5L8 10l1 3 3 1 3-1 1-3-2.5-1.5z" fill="white" opacity="0.5"/>
  </svg>
);

const HeroSection = () => {
  const { data: settings, isLoading } = useLandingSettings();

  // MANDATORY: Use fondo.jpg from public/landing as background
  const stadiumBg = "/landing/fondo.jpg";

  const scrollToRegister = () => {
    const element = document.getElementById("registrar-compra");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Always use fondo.jpg from public/landing/ (mandatory)
  const backgroundImage = stadiumBg;
  const overlayOpacity = settings?.theme?.overlayOpacity ?? 0.6;


  if (isLoading) {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#071A2E] to-[#0B2A4A]" />
        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-6">
          <Skeleton className="h-8 w-64 mx-auto bg-white/10" />
          <Skeleton className="h-20 w-full max-w-2xl mx-auto bg-white/10" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/10" />
          <Skeleton className="h-14 w-64 mx-auto bg-white/10 rounded-full" />
        </div>
      </section>
    );
  }

  const sorteoDate = settings?.draw_date ? new Date(settings.draw_date) : new Date("2026-07-15T20:00:00");
  const daysUntil = getDaysUntilDraw(settings?.draw_date || "2026-07-15T20:00:00");

  return (
    <section 
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden hero-stadium-enhanced"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Dynamic overlay with configurable opacity */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#071A2E] via-[#0B2A4A] to-[#071A2E]"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Animated Stadium lights - Sweeping effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-white/10 via-white/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            x: [-50, 50, -50],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -top-20 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-white/10 via-white/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            x: [50, -50, 50],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Spotlight beams */}
        <motion.div
          className="absolute top-0 left-1/3 w-2 h-[50vh] bg-gradient-to-b from-yellow-400/20 to-transparent origin-top"
          style={{ transform: "rotate(-15deg)" }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-2 h-[50vh] bg-gradient-to-b from-yellow-400/20 to-transparent origin-top"
          style={{ transform: "rotate(15deg)" }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />
      </div>
      
      {/* Floating Football balls */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`ball-${i}`}
            className="absolute text-white/20"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              x: [-20, 20, -20],
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
          >
            <FootballIcon className="w-8 h-8 md:w-12 md:h-12" />
          </motion.div>
        ))}
      </div>

      {/* Confetti/sparkles - More dynamic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() > 0.5 ? 20 : -20, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            {i % 4 === 0 ? (
              <Sparkles className="w-3 h-3 text-yellow-400" />
            ) : (
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF6A00' : '#22C55E',
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Animated ticket/coupon floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`ticket-${i}`}
            className="absolute"
            style={{
              left: `${5 + i * 18}%`,
              top: `${60 + Math.cos(i) * 20}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              rotate: [-15, 15, -15],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Ticket className="w-10 h-10 text-orange-400/30" />
          </motion.div>
        ))}
      </div>

      {/* Field lines decoration - Enhanced */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.4), transparent)" }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-20 border-2 border-green-500/30 rounded-t-full"
          animate={{ borderColor: ["rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0.5)", "rgba(34, 197, 94, 0.2)"] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        {/* Center circle */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-green-500/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Badge - Animated entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-6"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-green-400" />
          </motion.div>
          <span className="text-sm font-medium text-green-300 uppercase tracking-wider">Campaña Oficial Skyworth Bolivia</span>
        </motion.div>

        {/* Main Title - Dramatic entrance with glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-6 relative"
        >
          {/* Title glow effect */}
          <motion.div
            className="absolute inset-0 blur-3xl bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-green-500/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.h1 
            className="relative text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-wider text-white drop-shadow-2xl leading-tight"
            animate={{ textShadow: ["0 0 20px rgba(255,106,0,0.3)", "0 0 40px rgba(255,106,0,0.5)", "0 0 20px rgba(255,106,0,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {settings?.campaign_name || "EL SUEÑO DEL HINCHA"}
          </motion.h1>
        </motion.div>

        {/* Subtitle with typewriter-like effect */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto font-medium"
        >
          {settings?.campaign_tagline || "Gánate 1 viaje a Monterrey para alentar a La Verde en el repechaje"}
        </motion.p>

        {/* Draw date badge - Pulsing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 mb-10"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Calendar className="w-4 h-4 text-yellow-400" />
          </motion.div>
          <span className="text-sm font-bold text-yellow-300">
            Sorteo: {formatDrawDate(settings?.draw_date || "2026-07-15")} • Faltan {daysUntil} días
          </span>
        </motion.div>

        {/* CTA Button - Enhanced with bounce and glow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="mb-16"
        >
          <motion.button 
            onClick={scrollToRegister} 
            className="btn-cta-primary inline-flex items-center gap-3 shadow-glow-orange relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(255,106,0,0.4)",
                "0 0 40px rgba(255,106,0,0.6)",
                "0 0 20px rgba(255,106,0,0.4)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Trophy className="w-6 h-6 relative z-10" />
            </motion.div>
            <span className="relative z-10">{settings?.cta_text || "REGISTRAR COMPRA"}</span>
          </motion.button>
        </motion.div>

        {/* Prize Card - Enhanced with floating effect */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: "spring" }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="prize-card max-w-4xl mx-auto mb-12 relative"
        >
          {/* Animated border glow */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-green-500/30 rounded-3xl blur-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative bg-white rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <motion.div 
                className="prize-number"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                5
              </motion.div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl md:text-4xl font-black uppercase text-[#0B6FBF] leading-tight mb-2">
                  PAQUETES COMPLETOS
                </h3>
                <p className="text-lg md:text-xl text-[#0B2A4A] font-medium">
                  para ver y alentar a la <span className="font-bold">Selección Boliviana</span> en el{" "}
                  <motion.span 
                    className="font-black text-[#FF6A00] inline-block"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    REPECHAJE!
                  </motion.span>
                  {settings?.prize_destination && (
                    <span className="block text-base mt-1 text-gray-600">
                      Destino: {settings.prize_destination}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Benefits with staggered animations - SINGLE LABEL only (no duplicates) */}
            {settings?.sections?.showBenefits !== false && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <p className="text-sm uppercase tracking-widest text-gray-500 mb-6 font-bold">
                  El Premio Incluye:
                </p>
                <div className="flex flex-wrap justify-center gap-8">
                  {[
                    { icon: Plane, label: "Pasajes" },
                    { icon: Hotel, label: "Hospedaje" },
                    { icon: Ticket, label: "Entradas" },
                  ].map((item, index) => (
                    <motion.div 
                      key={index} 
                      className="flex flex-col items-center gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + index * 0.15 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                    >
                      <motion.div 
                        className="icon-circle"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                      >
                        <item.icon className="w-8 h-8" />
                      </motion.div>
                      <span className="text-sm font-bold text-[#0B2A4A] uppercase text-center">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Countdown - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <motion.p 
            className="text-white/70 text-sm uppercase tracking-widest mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⏱️ Tiempo restante para el sorteo
          </motion.p>
          <CountdownTimer targetDate={sorteoDate} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
