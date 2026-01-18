import { motion } from "framer-motion";
import { ShoppingCart, FileCheck, Ticket, Trophy, Sparkles } from "lucide-react";

const StepsSection = () => {
  const steps = [
    {
      number: "01",
      title: "COMPRA",
      description: "Adquiere tu TV Skyworth en cualquiera de nuestras tiendas autorizadas a nivel nacional.",
      icon: ShoppingCart,
      color: "from-blue-500 to-cyan-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
    },
    {
      number: "02",
      title: "REGISTRA",
      description: "Ingresa el serial de tu TV y sube tu factura. Validamos tu compra automáticamente.",
      icon: FileCheck,
      color: "from-orange-500 to-yellow-400",
      glowColor: "rgba(255, 106, 0, 0.4)",
    },
    {
      number: "03",
      title: "PARTICIPA",
      description: "Recibe tus cupones únicos y prepárate para ganar el viaje al Repechaje.",
      icon: Ticket,
      color: "from-green-500 to-emerald-400",
      glowColor: "rgba(34, 197, 94, 0.4)",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      }
    },
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B6FBF]/10 to-transparent" />
      
      {/* Animated floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            {i % 3 === 0 ? (
              <Trophy className="w-6 h-6 text-yellow-500/20" />
            ) : i % 3 === 1 ? (
              <Ticket className="w-6 h-6 text-orange-500/20" />
            ) : (
              <Sparkles className="w-4 h-4 text-green-500/20" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Title with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl">⚽</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase">
              <span className="text-white">LA TÁCTICA PARA</span>{" "}
              <motion.span 
                className="text-gradient-orange inline-block"
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(255,106,0,0.3)",
                    "0 0 30px rgba(255,106,0,0.5)",
                    "0 0 10px rgba(255,106,0,0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                GANAR
              </motion.span>
            </h2>
            <span className="text-4xl">🏆</span>
          </motion.div>
          <motion.p 
            className="text-muted-foreground text-lg max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Sigue estos 3 simples pasos y conviértete en un ganador
          </motion.p>
        </motion.div>

        {/* Steps Grid with staggered animations */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { type: "spring", stiffness: 300 }
              }}
              className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group cursor-pointer"
              style={{
                background: "hsla(210, 50%, 12%, 0.9)",
                border: "1px solid hsla(200, 100%, 50%, 0.2)"
              }}
            >
              {/* Animated background glow on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at center, ${step.glowColor}, transparent 70%)`
                }}
              />

              {/* Step Number - Large background */}
              <motion.span 
                className="text-7xl font-black absolute -top-4 -left-2 text-white pointer-events-none"
                initial={{ opacity: 0.05 }}
                whileHover={{ opacity: 0.15, scale: 1.1 }}
              >
                {step.number}
              </motion.span>

              {/* Animated connection line */}
              {index < steps.length - 1 && (
                <motion.div 
                  className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 h-0.5 overflow-hidden"
                  style={{ background: "linear-gradient(90deg, #FF6A00, transparent)" }}
                >
                  <motion.div
                    className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  />
                </motion.div>
              )}

              {/* Icon with animation */}
              <motion.div 
                className={`relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: index * 0.5 
                }}
                whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
              >
                <step.icon className="w-7 h-7 text-white" />
              </motion.div>

              {/* Content */}
              <motion.h3 
                className="relative z-10 text-xl font-bold uppercase mb-3 text-white"
                whileHover={{ x: 5 }}
              >
                {step.title}
              </motion.h3>
              <p className="relative z-10 text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Decorative corner */}
              <motion.div
                className="absolute bottom-0 right-0 w-20 h-20 opacity-10"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${step.glowColor} 100%)`
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Animated arrow pointing down */}
        <motion.div
          className="flex justify-center mt-12"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-sm uppercase tracking-wider">Revisa los modelos</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StepsSection;
