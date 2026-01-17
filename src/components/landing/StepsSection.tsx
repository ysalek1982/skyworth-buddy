import { motion } from "framer-motion";
import { ShoppingCart, FileCheck, Ticket } from "lucide-react";

const StepsSection = () => {
  const steps = [
    {
      number: "01",
      title: "COMPRA",
      description: "Adquiere tu TV Skyworth en cualquiera de nuestras tiendas autorizadas a nivel nacional.",
      icon: ShoppingCart,
    },
    {
      number: "02",
      title: "REGISTRA",
      description: "Ingresa el serial de tu TV y sube tu factura. Validamos tu compra automáticamente.",
      icon: FileCheck,
    },
    {
      number: "03",
      title: "PARTICIPA",
      description: "Recibe tus cupones únicos y prepárate para ganar el viaje al Repechaje.",
      icon: Ticket,
    },
  ];

  return (
    <section className="py-20 px-4 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B6FBF]/5 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
            <span className="text-white">LA TÁCTICA PARA</span>{" "}
            <span className="text-gradient-orange">GANAR</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sigue estos 3 simples pasos y conviértete en un ganador
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group"
              style={{
                background: "hsla(210, 50%, 12%, 0.8)",
                border: "1px solid hsla(200, 100%, 50%, 0.2)"
              }}
            >
              {/* Step Number */}
              <span className="text-6xl font-black opacity-10 absolute -top-2 -left-2 text-white">
                {step.number}
              </span>

              {/* Icon */}
              <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-orange/20 flex items-center justify-center mb-6 group-hover:bg-gradient-orange/30 transition-colors">
                <step.icon className="w-7 h-7 text-[#FF6A00]" />
              </div>

              {/* Content */}
              <h3 className="relative z-10 text-xl font-bold uppercase mb-3 text-white">
                {step.title}
              </h3>
              <p className="relative z-10 text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Decorative line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 h-0.5 bg-gradient-to-r from-[#FF6A00]/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
