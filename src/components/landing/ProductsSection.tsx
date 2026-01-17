import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket } from "lucide-react";
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

  const getTicketBadgeClass = (count: number) => {
    if (count >= 4) return "tier-4";
    if (count >= 3) return "tier-3";
    if (count >= 2) return "tier-2";
    return "tier-1";
  };

  return (
    <section id="modelos" className="py-20 px-4 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-blue shadow-glow-blue mb-4">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
            <span className="text-white">MODELOS </span>
            <span className="text-gradient-orange">PARTICIPANTES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Cada modelo te da un número diferente de tickets para participar
          </p>
        </motion.div>

        {/* Products Table - Glass Dark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-2xl overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando modelos...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Descripción</th>
                    <th className="text-center">Nro de Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-bold text-white">{product.model_name}</td>
                      <td>{product.description || "-"}</td>
                      <td className="text-center">
                        <span className={`ticket-badge ${getTicketBadgeClass(product.ticket_multiplier)}`}>
                          {product.ticket_multiplier}
                          <span className="ml-1.5">
                            {Array.from({ length: Math.min(product.ticket_multiplier, 4) }).map((_, i) => (
                              <span key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-current ml-0.5" />
                            ))}
                          </span>
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-wrap justify-center gap-4 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="ticket-badge tier-4">4</span>
            <span className="text-muted-foreground">Máximo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="ticket-badge tier-3">3</span>
            <span className="text-muted-foreground">Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="ticket-badge tier-2">2</span>
            <span className="text-muted-foreground">Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="ticket-badge tier-1">1</span>
            <span className="text-muted-foreground">Base</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductsSection;
