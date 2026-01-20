import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RegistroCompraForm from "@/components/landing/RegistroCompraForm";
import ChatBot from "@/components/chat/ChatBot";
import { motion } from "framer-motion";
import { Plane, Building2, Ticket, Trophy, Sparkles } from "lucide-react";
import { useLandingSettings } from "@/hooks/useLandingSettings";
import logoAJ from "@/assets/logo-aj-full.png";

const Index = () => {
  const { data: settings } = useLandingSettings();

  const scrollToRegister = () => {
    const element = document.querySelector("#registrar-compra");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const prizeFeatures = [
    { icon: Plane, label: "Pasajes", sublabel: "PASAJES" },
    { icon: Building2, label: "Hospedaje", sublabel: "HOSPEDAJE" },
    { icon: Ticket, label: "Entradas", sublabel: "ENTRADAS" },
  ];

  return (
    <div className="min-h-screen bg-[#071825] relative overflow-hidden">
      <Header />
      
      <main className="relative z-10 pt-16">
        {/* HERO SECTION */}
        <section 
          id="inicio" 
          className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col items-center justify-center px-4 py-20"
          style={{
            backgroundImage: `url('/landing/fondo.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Gradient overlay top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071825]/70 via-transparent to-[#071825]" />
          
          {/* Hero Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Main Logo */}
            <motion.img
              src="/landing/sueno_hincha.png"
              alt="El Sueño del Hincha Skyworth"
              className="w-full max-w-[700px] md:max-w-[850px] mx-auto mb-8"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            />

            {/* Subtitle Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6"
            >
              <p className="text-white text-lg md:text-xl font-semibold tracking-wide">
                COMPRA TU TV SKYWORTH, REGISTRA TU COMPRA
              </p>
              <p className="text-white/80 text-lg md:text-xl">
                Y PARTICIPA POR INCREÍBLES PREMIOS.
              </p>
            </motion.div>

            {/* Orange Highlight */}
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-[#FF6A00] text-xl md:text-2xl font-bold mb-10"
            >
              ¡TU BOLETO AL REPECHAJE TE ESPERA!
            </motion.p>

            {/* CTA Button */}
            <motion.button
              onClick={scrollToRegister}
              className="bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              REGISTRAR COMPRA
            </motion.button>
          </div>
        </section>

        {/* PRIZE BANNER SECTION */}
        <section className="relative py-12 px-4">
          {/* White Container with Prize Banner */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 -mt-20 relative z-20"
          >
            <img
              src="/landing/5_paquetes.png"
              alt="5 Paquetes para ver y alentar a la Selección en el Repechaje"
              className="w-full max-w-[600px] mx-auto"
            />
          </motion.div>

          {/* Prize Features */}
          <div className="max-w-4xl mx-auto mt-12">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-white text-xl md:text-2xl font-bold text-center mb-8 uppercase tracking-wide"
            >
              EL PREMIO INCLUYE:
            </motion.h3>

            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {prizeFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm md:text-base">{feature.label}</p>
                  <p className="text-white/70 text-xs md:text-sm font-bold uppercase">{feature.sublabel}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AJ Logo & Legal Text */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mt-12 flex flex-col md:flex-row items-center gap-6 px-4"
          >
            <div className="bg-white rounded-lg px-4 py-3 flex-shrink-0">
              <img 
                src={logoAJ} 
                alt="Autoridad de Fiscalización del Juego" 
                className="h-10 md:h-12 w-auto"
              />
            </div>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              Promoción válida desde la emisión de resolución administrativa de autorización hasta el 16 de marzo de 2026.
              Para más información, ingresa a: <span className="text-[#FF6A00] font-semibold">hincha.skyworth.bo</span>
            </p>
          </motion.div>
        </section>

        {/* REGISTRATION FORM SECTION */}
        <section id="registrar-compra" className="py-20 px-4 scroll-mt-20 relative">
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="text-center mb-12"
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6A00] shadow-lg shadow-orange-500/30 mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-white">
                REGISTRA TU{" "}
                <span className="text-[#FF6A00]">COMPRA</span>
              </h2>
              <p className="text-white/70 text-base max-w-xl mx-auto flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Completa el formulario con los datos de tu TV Skyworth
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </p>
            </motion.div>

            <RegistroCompraForm />
          </div>
        </section>

        {/* Disclaimer */}
        {settings?.disclaimer && (
          <section className="pb-10 px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-sm text-white/50">
                {settings.disclaimer}
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
      
      {/* ChatBot */}
      {settings?.sections?.showBot !== false && <ChatBot />}
    </div>
  );
};

export default Index;
