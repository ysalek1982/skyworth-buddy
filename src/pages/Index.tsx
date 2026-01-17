import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import StepsSection from "@/components/landing/StepsSection";
import ProductsSection from "@/components/landing/ProductsSection";
import RegistroCompraForm from "@/components/landing/RegistroCompraForm";
import ChatBot from "@/components/chat/ChatBot";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const Index = () => {
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
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
