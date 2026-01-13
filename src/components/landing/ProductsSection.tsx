import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tv, Star, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  model_name: string;
  tier: string;
  coupon_multiplier: number | null;
  ticket_multiplier: number;
  screen_size: number | null;
  image_url: string | null;
}

const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, model_name, tier, coupon_multiplier, ticket_multiplier, screen_size, image_url")
        .eq("is_active", true)
        .order("screen_size", { ascending: true });

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const getTicketCount = (product: Product) => {
    return product.coupon_multiplier || product.ticket_multiplier || 1;
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
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
            <span className="text-foreground">MODELOS</span>{" "}
            <span className="text-gradient-gold">PARTICIPANTES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Mientras más grande tu TV, más cupones ganas
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => {
            const ticketCount = getTicketCount(product);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl overflow-hidden shadow-card group hover:shadow-glow-gold transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-skyworth-blue-light to-skyworth-blue-medium flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.model_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tv className="w-24 h-24 text-foreground/20" />
                  )}

                  {/* Tier Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {product.tier}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">
                    {product.model_name}
                  </h3>

                  {product.screen_size && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.screen_size}" pulgadas
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-primary">
                    <Ticket className="w-5 h-5" />
                    <span className="font-bold text-lg">
                      {ticketCount} cupón{ticketCount > 1 ? "es" : ""}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1">
                    {[...Array(Math.min(ticketCount, 5))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                    {[...Array(Math.max(0, 5 - ticketCount))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-muted" />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
