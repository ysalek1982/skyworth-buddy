import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import StepsSection from "@/components/landing/StepsSection";
import ProductsSection from "@/components/landing/ProductsSection";
import RegistroCompraForm from "@/components/landing/RegistroCompraForm";
import ChatBot from "@/components/chat/ChatBot";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, AlertCircle } from "lucide-react";
import { useLandingSettings } from "@/hooks/useLandingSettings";

const Index = () => {
  const { data: settings } = useLandingSettings();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main>
        {/* Hero Section - Full screen */}
        <section id="inicio">
          <HeroSection />
        </section>

        {/* Steps Section */}
        <StepsSection />

        {/* Products Table Section */}
        <ProductsSection />

        {/* Requirements Section - Conditional */}
        {settings?.sections?.showRequirements !== false && settings?.requirements && settings.requirements.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-8 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white uppercase">Requisitos Principales</h3>
                </div>
                <ul className="grid gap-3">
                  {settings.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/90">{req}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </section>
        )}

        {/* Registration Form Section */}
        <section id="registrar-compra" className="py-20 px-4 scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-orange shadow-glow-orange mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
                <span className="text-white">REGISTRA TU </span>
                <span className="text-gradient-orange">COMPRA</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Completa el formulario con los datos de tu TV Skyworth y participa por el viaje al Repechaje
              </p>
            </motion.div>

            <RegistroCompraForm />
          </div>
        </section>

        {/* Disclaimer Section */}
        {settings?.disclaimer && (
          <section className="pb-10 px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-sm text-muted-foreground/70">
                {settings.disclaimer}
              </p>
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
