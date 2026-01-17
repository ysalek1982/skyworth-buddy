import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tv, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  model_name: string;
  model_key: string | null;
  tier: string;
  ticket_multiplier: number;
  description: string | null;
  image_url: string | null;
}

const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, model_name, model_key, tier, ticket_multiplier, description, image_url")
        .eq("is_active", true)
        .order("ticket_multiplier", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'T1': return 'Premium';
      case 'T2': return 'Mid';
      case 'T3': return 'Standard';
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'T1': return 'bg-gradient-gold text-skyworth-dark';
      case 'T2': return 'bg-secondary text-white';
      case 'T3': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-muted-foreground">Cargando productos...</div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
            <span className="text-foreground">MODELOS </span>
            <span className="text-gradient-gold">PARTICIPANTES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Mientras más grande tu TV, más tickets ganas para el sorteo
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="product-card group"
            >
              {/* Product Image */}
              <div className="relative h-40 bg-gradient-card-green flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.model_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Tv className="w-20 h-20 text-foreground/20" />
                )}

                {/* Tier Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${getTierColor(product.tier)}`}>
                  {getTierLabel(product.tier)}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {product.model_name}
                </h3>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.description}
                  </p>
                )}

                {/* Tickets */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-black text-xl text-primary">
                        {product.ticket_multiplier}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        {product.ticket_multiplier === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>
                  </div>

                  {/* Visual indicator */}
                  <div className="flex gap-1">
                    {[...Array(product.ticket_multiplier)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    ))}
                    {[...Array(Math.max(0, 4 - product.ticket_multiplier))].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 rounded-full bg-muted"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
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