import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import PathSelector from "@/components/landing/PathSelector";
import StepsSection from "@/components/landing/StepsSection";
import ProductsSection from "@/components/landing/ProductsSection";
import ChatBot from "@/components/chat/ChatBot";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero field-pattern">
      <Header />
      <main className="main-content">
        <HeroSection />
        <section id="registrar-compra">
          <PathSelector />
        </section>
        <StepsSection />
        <ProductsSection />
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;