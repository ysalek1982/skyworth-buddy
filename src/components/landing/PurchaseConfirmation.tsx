import { motion } from "framer-motion";
import { 
  Trophy, CheckCircle, Gift, Copy, Home, Ticket, Tv, Calendar,
  PartyPopper, Medal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLandingSettings } from "@/hooks/useLandingSettings";

interface CouponData {
  code: string;
}

interface PurchaseConfirmationProps {
  coupons: CouponData[];
  productName: string;
  serialNumber: string;
  couponCount: number;
  onReset: () => void;
}

const PurchaseConfirmation = ({
  coupons,
  productName,
  serialNumber,
  couponCount,
  onReset,
}: PurchaseConfirmationProps) => {
  const { data: settings } = useLandingSettings();

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("¡Cupón copiado!");
  };

  const copyAllCoupons = () => {
    const allCodes = coupons.map(c => c.code).join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success("¡Todos los cupones copiados!");
  };

  const formatDrawDate = () => {
    if (!settings?.draw_date) return null;
    const date = new Date(settings.draw_date);
    return date.toLocaleDateString('es-BO', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="text-center py-4">
      {/* Confetti animation placeholder - visual flair */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: -20, 
              x: Math.random() * 100 - 50,
              rotate: 0,
              opacity: 1 
            }}
            animate={{ 
              y: 400, 
              x: Math.random() * 200 - 100,
              rotate: 360,
              opacity: 0 
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: "easeOut"
            }}
            className="absolute"
            style={{ left: `${10 + i * 8}%` }}
          >
            <div className={`w-3 h-3 ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-accent' : 'bg-yellow-400'} rounded-sm`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Hero celebration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="relative inline-block mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-yellow-500 flex items-center justify-center shadow-2xl shadow-primary/40">
          <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
        >
          <CheckCircle className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-3xl md:text-4xl font-black text-white uppercase mb-2 tracking-tight">
          ¡GOLAZO! 
        </h3>
        <p className="text-xl text-primary font-bold mb-1">Tu compra está registrada</p>
        <p className="text-muted-foreground mb-6">
          Podrías ser el próximo ganador rumbo al repechaje ⚽
        </p>
      </motion.div>

      {/* Scoreboard style status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-600/20 via-primary/20 to-green-600/20 border-2 border-primary/50 rounded-2xl p-5 mb-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground tracking-wider">Registro</p>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-bold">CONFIRMADO</span>
            </div>
          </div>
          <div className="space-y-1 border-x border-white/10 px-2">
            <p className="text-xs uppercase text-muted-foreground tracking-wider">Cupones</p>
            <p className="text-4xl font-black text-gradient-orange">{couponCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground tracking-wider">Serial</p>
            <p className="text-white font-mono text-sm truncate">{serialNumber}</p>
          </div>
        </div>
      </motion.div>

      {/* Coupon tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-accent" />
          <h4 className="text-lg font-bold text-white uppercase">Tus Cupones para el Sorteo</h4>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {coupons.map((coupon, index) => (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="relative bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/40 rounded-xl overflow-hidden group"
            >
              {/* Ticket notch left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-r-full" />
              {/* Ticket notch right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-l-full" />
              
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
                    <Medal className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-white font-mono tracking-wider">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-muted-foreground">{productName}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyCoupon(coupon.code)}
                  className="text-accent hover:text-white hover:bg-accent/30"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* Dashed line separator */}
              <div className="border-t border-dashed border-white/20 mx-6" />
              
              <div className="px-6 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tv className="w-3 h-3" />
                  Skyworth
                </span>
                {formatDrawDate() && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Sorteo: {formatDrawDate()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {coupons.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllCoupons}
            className="mt-4 border-accent/50 text-accent hover:bg-accent/20"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar todos los cupones
          </Button>
        )}
      </motion.div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <PartyPopper className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-white font-medium mb-1">
              ¡Guárdalos bien!
            </p>
            <p className="text-sm text-muted-foreground">
              Estos son tus códigos oficiales para el sorteo. Entre más grande tu TV, más cupones obtienes. 
              {settings?.prize_destination && (
                <span className="text-yellow-400 font-medium"> ¡Te esperamos en {settings.prize_destination}!</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notification status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8"
      >
        <div className="flex items-center justify-center gap-3">
          <Gift className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-blue-200">
            Te enviaremos estos cupones a tu correo y WhatsApp registrados.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          variant="outline"
          className="border-border text-white hover:bg-muted/50"
        >
          <Home className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>
        <Button
          onClick={onReset}
          className="bg-gradient-orange text-white font-bold uppercase tracking-wider hover:opacity-90"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Registrar otra compra
        </Button>
      </motion.div>
    </div>
  );
};

export default PurchaseConfirmation;
