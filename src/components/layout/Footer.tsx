import { useState } from "react";
import { Trophy, Mail, Phone, MapPin } from "lucide-react";
import TermsModal from "@/components/landing/TermsModal";

const Footer = () => {
  const [termsOpen, setTermsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <footer className="border-t border-white/10 bg-[#071825]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">SKYWORTH</h3>
                  <p className="text-xs text-[#FF6A00]">El Sueño del Hincha</p>
                </div>
              </div>
              <p className="text-sm text-white/60 max-w-sm">
                Compra tu TV Skyworth y participa por el viaje de tu vida al repechaje rumbo a México 2026.
                ¡Tu oportunidad de alentar a La Verde está aquí!
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 uppercase text-sm">Enlaces</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection("#inicio")}
                    className="text-sm text-white/60 hover:text-[#FF6A00] transition-colors"
                  >
                    Inicio
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("#registrar-compra")}
                    className="text-sm text-white/60 hover:text-[#FF6A00] transition-colors"
                  >
                    Registrar Compra
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setTermsOpen(true)}
                    className="text-sm text-white/60 hover:text-[#FF6A00] transition-colors text-left"
                  >
                    Términos y Condiciones
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4 uppercase text-sm">Contacto</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <Mail className="w-4 h-4 text-[#FF6A00]" />
                  soporte@skyworth.com
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <Phone className="w-4 h-4 text-[#FF6A00]" />
                  +591 800 10 2026
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="w-4 h-4 text-[#FF6A00]" />
                  Bolivia
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/50">
                © 2026 Skyworth. Todos los derechos reservados.
              </p>
              <p className="text-xs text-white/40">
                Promoción válida hasta el 7 de marzo de 2026
              </p>
            </div>
          </div>
        </div>
      </footer>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
};

export default Footer;
