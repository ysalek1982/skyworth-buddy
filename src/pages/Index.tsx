import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import StepsSection from "@/components/landing/StepsSection";
import ProductsSection from "@/components/landing/ProductsSection";
import RegistroCompraForm from "@/components/landing/RegistroCompraForm";
import ChatBot from "@/components/chat/ChatBot";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, AlertCircle, Sparkles, Star } from "lucide-react";
import { useLandingSettings } from "@/hooks/useLandingSettings";

const Index = () => {
  const { data: settings } = useLandingSettings();

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Global animated background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`global-star-${i}`}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + Math.sin(i * 2) * 30}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i,
            }}
          >
            <Star className="w-16 h-16 text-yellow-400/10" />
          </motion.div>
        ))}
      </div>

      <Header />
      <main className="relative z-10">
        {/* Hero Section - Full screen */}
        <section id="inicio">
          <HeroSection />
        </section>

        {/* Steps Section */}
        <StepsSection />

        {/* Products Table Section */}
        <ProductsSection />

        {/* Requirements Section - Conditional with enhanced design */}
        {settings?.sections?.showRequirements !== false && settings?.requirements && settings.requirements.length > 0 && (
          <section className="py-16 px-4 relative">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring" }}
                className="glass-effect rounded-2xl p-8 border border-white/10 relative overflow-hidden"
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white uppercase">Requisitos Principales</h3>
                  </div>
                  <ul className="grid gap-3">
                    {settings.requirements.map((req, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        </motion.div>
                        <span className="text-white/90">{req}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Registration Form Section - Enhanced */}
        <section id="registrar-compra" className="py-20 px-4 scroll-mt-24 relative">
          {/* Section background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-1/4 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
              animate={{ x: [-50, 50, -50], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-1/4 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"
              animate={{ x: [50, -50, 50], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="text-center mb-12"
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-orange shadow-glow-orange mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
                <span className="text-white">REGISTRA TU </span>
                <motion.span 
                  className="text-gradient-orange inline-block"
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(255,106,0,0.3)",
                      "0 0 40px rgba(255,106,0,0.5)",
                      "0 0 20px rgba(255,106,0,0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  COMPRA
                </motion.span>
              </h2>
              <motion.p 
                className="text-muted-foreground text-lg max-w-xl mx-auto flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Completa el formulario con los datos de tu TV Skyworth y participa por el viaje al Repechaje
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.p>
            </motion.div>

            <RegistroCompraForm />
          </div>
        </section>

        {/* Disclaimer Section */}
        {settings?.disclaimer && (
          <section className="pb-10 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.p 
                className="text-center text-sm text-muted-foreground/70"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                {settings.disclaimer}
              </motion.p>
            </div>
          </section>
        )}
      </main>
      <Footer />
      
      {/* ChatBot - Conditional based on CMS settings */}
      {settings?.sections?.showBot !== false && <ChatBot />}
    </div>
  );
};

export default Index;
