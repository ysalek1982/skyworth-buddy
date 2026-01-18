import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Ticket, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  model_name: string;
  description: string | null;
  ticket_multiplier: number;
}

const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, model_name, description, ticket_multiplier")
        .eq("is_active", true)
        .order("ticket_multiplier", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const getCouponBadgeClass = (count: number) => {
    if (count >= 4) return "tier-4";
    if (count >= 3) return "tier-3";
    if (count >= 2) return "tier-2";
    return "tier-1";
  };

  const getStars = (count: number) => {
    return Array.from({ length: Math.min(count, 5) });
  };

  return (
    <section id="modelos" className="py-20 px-4 scroll-mt-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              rotate: [0, 360],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            <Ticket className="w-8 h-8 text-orange-500/10" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header with enhanced animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-blue shadow-glow-blue mb-4"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Gift className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
            <span className="text-white">MODELOS </span>
            <motion.span 
              className="text-gradient-orange inline-block"
              animate={{ 
                textShadow: [
                  "0 0 10px rgba(255,106,0,0.3)",
                  "0 0 20px rgba(255,106,0,0.5)",
                  "0 0 10px rgba(255,106,0,0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PARTICIPANTES
            </motion.span>
          </h2>
          <motion.p 
            className="text-muted-foreground text-lg max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Cada modelo te da un número diferente de cupones para participar ⚽
          </motion.p>
        </motion.div>

        {/* Products Table - Enhanced with animations */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, type: "spring" }}
          className="glass-dark rounded-2xl overflow-hidden relative"
        >
          {/* Animated border glow */}
          <motion.div
            className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/30 via-orange-500/30 to-green-500/30 rounded-2xl -z-10"
            animate={{ 
              background: [
                "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(255,106,0,0.3), rgba(34,197,94,0.3))",
                "linear-gradient(180deg, rgba(59,130,246,0.3), rgba(255,106,0,0.3), rgba(34,197,94,0.3))",
                "linear-gradient(270deg, rgba(59,130,246,0.3), rgba(255,106,0,0.3), rgba(34,197,94,0.3))",
                "linear-gradient(360deg, rgba(59,130,246,0.3), rgba(255,106,0,0.3), rgba(34,197,94,0.3))",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Sparkles className="w-8 h-8 text-orange-400" />
              </motion.div>
              <p className="mt-4">Cargando modelos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Descripción</th>
                    <th className="text-center">Nro de Cupones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, type: "spring" }}
                      whileHover={{ 
                        backgroundColor: "rgba(255,106,0,0.05)",
                        x: 5,
                        transition: { duration: 0.2 }
                      }}
                      className="cursor-pointer"
                    >
                      <td className="font-bold text-white">
                        <div className="flex items-center gap-2">
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          >
                            📺
                          </motion.span>
                          {product.model_name}
                        </div>
                      </td>
                      <td>{product.description || "-"}</td>
                      <td className="text-center">
                        <motion.span 
                          className={`ticket-badge ${getCouponBadgeClass(product.ticket_multiplier)} inline-flex items-center gap-1`}
                          whileHover={{ scale: 1.1 }}
                          animate={{ 
                            boxShadow: product.ticket_multiplier >= 3 
                              ? ["0 0 10px rgba(255,106,0,0.3)", "0 0 20px rgba(255,106,0,0.5)", "0 0 10px rgba(255,106,0,0.3)"]
                              : "none"
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {product.ticket_multiplier}
                          <span className="flex gap-0.5 ml-1">
                            {getStars(product.ticket_multiplier).map((_, i) => (
                              <motion.span 
                                key={i}
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 1, 0.7]
                                }}
                                transition={{ 
                                  duration: 1, 
                                  repeat: Infinity, 
                                  delay: i * 0.15 
                                }}
                              >
                                <Star className="w-3 h-3 fill-current" />
                              </motion.span>
                            ))}
                          </span>
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Legend with cleaner labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm"
        >
          {[
            { tier: "tier-4", count: 4 },
            { tier: "tier-3", count: 3 },
            { tier: "tier-2", count: 2 },
            { tier: "tier-1", count: 1 },
          ].map((item, i) => (
            <motion.div 
              key={item.tier}
              className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <span className={`ticket-badge ${item.tier}`}>{item.count}</span>
              <span className="text-white/80 font-medium">
                {item.count} {item.count === 1 ? "Cupón" : "Cupones"}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center"
        >
          <motion.p 
            className="text-white/60 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ¡Mientras más cupones, más oportunidades de ganar! 🎉
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductsSection;
