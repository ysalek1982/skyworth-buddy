import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const getTicketBadgeColor = (multiplier: number) => {
    switch (multiplier) {
      case 4:
        return "bg-gradient-gold text-skyworth-dark font-bold";
      case 3:
        return "bg-green-500 text-white font-bold";
      case 2:
        return "bg-blue-500 text-white font-bold";
      default:
        return "bg-muted text-foreground font-bold";
    }
  };

  if (loading) {
    return (
      <section id="modelos" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-muted-foreground">Cargando productos...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="modelos" className="py-20 px-4 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
            <span className="text-foreground">MODELOS </span>
            <span className="text-gradient-gold">PARTICIPANTES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Mientras más grande tu TV, más tickets ganas para el sorteo
          </p>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-skyworth-dark/80 text-white">
                  <th className="px-6 py-4 text-left font-bold uppercase text-sm">Modelo</th>
                  <th className="px-6 py-4 text-left font-bold uppercase text-sm">Descripción</th>
                  <th className="px-6 py-4 text-center font-bold uppercase text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Nro de Tickets
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground">{product.model_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{product.description || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={`text-lg px-4 py-1 ${getTicketBadgeColor(product.ticket_multiplier)}`}>
                        {product.ticket_multiplier}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Cada ticket es una oportunidad de ganar el viaje al Mundial 2026 🏆
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductsSection;
