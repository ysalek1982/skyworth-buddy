import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy, Sparkles, RotateCcw, PartyPopper, User, MapPin, CreditCard, Phone } from 'lucide-react';
import suenoHinchaBadge from '@/assets/sueno-hincha-badge.png';
import stadiumBg from '@/assets/stadium-bg.jpg';

interface Coupon {
  id: string;
  code: string;
  owner_type: 'BUYER' | 'SELLER';
  buyer_purchase_id: string | null;
}

interface Winner {
  code: string;
  full_name: string;
  dni: string;
  city: string;
  department: string;
  email: string;
  phone: string;
}

interface DrawTombolaProps {
  onComplete: (winners: Winner[]) => void;
  finalistsCount: number;
}

export default function DrawTombola({ onComplete, finalistsCount }: DrawTombolaProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [displayCodes, setDisplayCodes] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, owner_type, buyer_purchase_id')
      .eq('status', 'ACTIVE')
      .eq('owner_type', 'BUYER');

    if (error) {
      toast.error('Error al cargar cupones');
      return;
    }

    setCoupons(data || []);
    
    // Initialize display codes with 5 random codes
    const codes = (data || []).map(c => c.code);
    if (codes.length > 0) {
      const initial = [];
      for (let i = 0; i < 5; i++) {
        initial.push(codes[Math.floor(Math.random() * codes.length)]);
      }
      setDisplayCodes(initial);
    }
  };

  const getRandomCode = () => {
    if (coupons.length === 0) return 'BOL-2026-XXXXX';
    return coupons[Math.floor(Math.random() * coupons.length)].code;
  };

  const spinTombola = async () => {
    if (coupons.length === 0) {
      toast.error('No hay cupones activos para el sorteo');
      return;
    }

    if (currentWinnerIndex >= finalistsCount) {
      toast.info('Ya se seleccionaron todos los ganadores');
      return;
    }

    setIsSpinning(true);
    setShowWinnerReveal(false);

    // Start rapid cycling animation
    let spinCount = 0;
    const maxSpins = 30 + Math.floor(Math.random() * 20);
    
    intervalRef.current = setInterval(() => {
      setDisplayCodes(prev => {
        const newCodes = [...prev.slice(1), getRandomCode()];
        return newCodes;
      });
      
      spinCount++;
      
      if (spinCount >= maxSpins) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        selectWinner();
      }
    }, 80 - (spinCount * 1.5));

    // Slow down effect
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      let slowSpins = 0;
      intervalRef.current = setInterval(() => {
        setDisplayCodes(prev => {
          const newCodes = [...prev.slice(1), getRandomCode()];
          return newCodes;
        });
        slowSpins++;
        
        if (slowSpins >= 10) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          selectWinner();
        }
      }, 200 + slowSpins * 30);
    }, 2000);
  };

  const selectWinner = async () => {
    const remainingCoupons = coupons.filter(
      c => !winners.some(w => w.code === c.code)
    );

    if (remainingCoupons.length === 0) {
      toast.error('No quedan cupones disponibles');
      setIsSpinning(false);
      return;
    }

    const winnerCoupon = remainingCoupons[Math.floor(Math.random() * remainingCoupons.length)];
    
    if (winnerCoupon.buyer_purchase_id) {
      const { data: purchase } = await supabase
        .from('client_purchases')
        .select('full_name, dni, city, email, phone')
        .eq('id', winnerCoupon.buyer_purchase_id)
        .single();

      if (purchase) {
        const department = purchase.city || 'No especificado';
        
        const winner: Winner = {
          code: winnerCoupon.code,
          full_name: purchase.full_name,
          dni: purchase.dni,
          city: purchase.city || 'No especificada',
          department: department,
          email: purchase.email,
          phone: purchase.phone
        };

        setDisplayCodes([
          getRandomCode(),
          getRandomCode(),
          winnerCoupon.code,
          getRandomCode(),
          getRandomCode()
        ]);

        setTimeout(() => {
          setCurrentWinner(winner);
          setShowWinnerReveal(true);
          setWinners(prev => [...prev, winner]);
          setCurrentWinnerIndex(prev => prev + 1);
          setIsSpinning(false);
        }, 500);
      }
    } else {
      const winner: Winner = {
        code: winnerCoupon.code,
        full_name: 'Participante',
        dni: 'N/A',
        city: 'N/A',
        department: 'No especificado',
        email: 'N/A',
        phone: 'N/A'
      };
      
      setDisplayCodes([
        getRandomCode(),
        getRandomCode(),
        winnerCoupon.code,
        getRandomCode(),
        getRandomCode()
      ]);

      setTimeout(() => {
        setCurrentWinner(winner);
        setShowWinnerReveal(true);
        setWinners(prev => [...prev, winner]);
        setCurrentWinnerIndex(prev => prev + 1);
        setIsSpinning(false);
      }, 500);
    }
  };

  const resetTombola = () => {
    setWinners([]);
    setCurrentWinner(null);
    setShowWinnerReveal(false);
    setCurrentWinnerIndex(0);
    loadCoupons();
  };

  const finishDraw = () => {
    onComplete(winners);
  };

  // Mask phone for display (show last 4 digits)
  const maskPhone = (phone: string) => {
    if (!phone || phone === 'N/A') return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return '****' + cleaned.slice(-4);
  };

  return (
    <div className="relative min-h-[700px] rounded-2xl overflow-hidden">
      {/* Stadium Background with lights */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${stadiumBg})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#0a1628]/70 to-[#0a1628]/90" />
      
      {/* Stadium Lights Effect */}
      <div className="absolute top-0 left-1/4 w-32 h-64 bg-gradient-to-b from-white/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-64 bg-gradient-to-b from-white/20 to-transparent blur-3xl pointer-events-none" />
      
      {/* Confetti Animation */}
      <AnimatePresence>
        {showWinnerReveal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-20"
          >
            {[...Array(60)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: Math.random() > 0.5 ? 12 : 8,
                  height: Math.random() > 0.5 ? 12 : 8,
                  backgroundColor: ['#FFD700', '#FF6B00', '#00BFFF', '#FF1493', '#00FF7F', '#ffffff'][i % 6],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  left: `${Math.random() * 100}%`,
                  top: -20
                }}
                animate={{
                  y: [0, 700],
                  x: [0, (Math.random() - 0.5) * 300],
                  rotate: [0, 720 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  delay: Math.random() * 0.8,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 lg:p-10 flex flex-col lg:flex-row items-center justify-center gap-8 min-h-[600px]">
        
        {/* Badge "El Sueño del Hincha" - Left Side */}
        <div className="flex-shrink-0 relative">
          <motion.div
            animate={{ 
              scale: isSpinning ? [1, 1.02, 1] : 1,
            }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.6 }}
            className="relative"
          >
            <img 
              src={suenoHinchaBadge} 
              alt="El Sueño del Hincha - Skyworth" 
              className="w-56 h-56 lg:w-72 lg:h-72 object-contain drop-shadow-2xl"
            />
            {isSpinning && (
              <motion.div 
                className="absolute -inset-4 rounded-full border-4 border-amber-400/50"
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>

        {/* Tombola Display - Right Side */}
        <div className="flex-1 w-full max-w-lg">
          <AnimatePresence mode="wait">
            {!showWinnerReveal ? (
              /* ============= SLOT MACHINE VIEW ============= */
              <motion.div
                key="tombola"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                {/* Main Slot Container */}
                <div className="relative bg-gradient-to-b from-[#1a3a5c] to-[#0d2035] rounded-xl border-2 border-[#3a6a8a] shadow-2xl overflow-hidden">
                  {/* Top decorative bar */}
                  <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500" />
                  
                  {/* Slot Display Area */}
                  <div className="relative px-6 py-4">
                    {/* Highlight row - center indicator */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-gradient-to-r from-cyan-500/10 via-cyan-400/20 to-cyan-500/10 border-y-2 border-cyan-400/60 z-10 pointer-events-none" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-400 z-10" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-400 z-10" />
                    
                    {/* Codes list */}
                    <div className="space-y-0.5 py-2">
                      {displayCodes.map((code, index) => (
                        <motion.div
                          key={`${index}-${code}`}
                          initial={{ opacity: 0, y: -15 }}
                          animate={{ 
                            opacity: index === 2 ? 1 : 0.35,
                            y: 0,
                            scale: index === 2 ? 1.05 : 1
                          }}
                          className={`text-center py-2.5 font-mono tracking-widest transition-all ${
                            index === 2 
                              ? 'text-white font-bold text-2xl' 
                              : 'text-white/50 text-lg'
                          }`}
                        >
                          {code}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* GIRAR Button */}
                  <div className="p-4 bg-[#0d2035]/80 border-t border-[#3a6a8a]/50">
                    <Button
                      onClick={spinTombola}
                      disabled={isSpinning || currentWinnerIndex >= finalistsCount}
                      className="w-full h-14 text-xl font-bold rounded-lg bg-gradient-to-b from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white shadow-lg shadow-green-500/40 border-2 border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSpinning ? (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Sparkles className="h-6 w-6 animate-spin" />
                          GIRANDO...
                        </motion.span>
                      ) : currentWinnerIndex >= finalistsCount ? (
                        <span className="flex items-center justify-center gap-2">
                          <Trophy className="h-6 w-6" />
                          SORTEO COMPLETO
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          GIRAR
                        </span>
                      )}
                    </Button>
                    
                    {/* Progress indicator */}
                    <p className="text-center text-cyan-400/80 text-sm mt-2">
                      Ganador {currentWinnerIndex + 1} de {finalistsCount}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ============= WINNER REVEAL VIEW ============= */
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative"
              >
                <div className="relative bg-gradient-to-b from-[#1a3a5c] to-[#0d2035] rounded-xl border-2 border-amber-500/70 shadow-2xl overflow-hidden">
                  {/* Top decorative bar with glow */}
                  <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
                  
                  {/* Winner Header with Code */}
                  <div className="p-6 text-center border-b border-[#3a6a8a]/50">
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-amber-400 text-sm font-medium tracking-wider mb-2"
                    >
                      Número ganador
                    </motion.p>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                      className="inline-block bg-gradient-to-r from-cyan-600 to-cyan-500 px-8 py-3 rounded-lg shadow-lg shadow-cyan-500/30"
                    >
                      <span className="font-mono font-bold text-3xl text-white tracking-widest">
                        {currentWinner?.code}
                      </span>
                    </motion.div>
                  </div>

                  {/* Winner Details */}
                  <div className="p-6 space-y-5">
                    {/* Name */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1">Ganador:</p>
                        <p className="text-white font-bold text-2xl">{currentWinner?.full_name}</p>
                      </div>
                    </motion.div>

                    {/* DNI */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1">Carnet de identidad:</p>
                        <p className="text-white font-bold text-xl">{currentWinner?.dni}</p>
                      </div>
                    </motion.div>

                    {/* Department/City */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1">Ciudad:</p>
                        <p className="text-white font-bold text-xl uppercase">{currentWinner?.department}</p>
                      </div>
                    </motion.div>

                    {/* Phone */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1">Teléfono:</p>
                        <p className="text-white font-bold text-xl">{maskPhone(currentWinner?.phone || '')}</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Continue Button */}
                  <div className="p-4 bg-[#0d2035]/80 border-t border-[#3a6a8a]/50">
                    <Button
                      onClick={() => setShowWinnerReveal(false)}
                      disabled={currentWinnerIndex >= finalistsCount}
                      className="w-full h-12 font-bold rounded-lg bg-gradient-to-b from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg border border-cyan-400/50"
                    >
                      {currentWinnerIndex < finalistsCount ? (
                        <span className="flex items-center justify-center gap-2">
                          <RotateCcw className="h-5 w-5" />
                          Siguiente Ganador ({currentWinnerIndex}/{finalistsCount})
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Ver Todos los Ganadores
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Winners List */}
      {winners.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-6 lg:px-10 pb-8"
        >
          <div className="bg-[#0d2035]/90 border border-amber-500/40 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ganadores Seleccionados ({winners.length}/{finalistsCount})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#1a3a5c] to-[#0d2035] rounded-lg p-4 border border-cyan-500/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">#{index + 1}</Badge>
                    <span className="font-mono text-cyan-400 text-sm">{winner.code}</span>
                  </div>
                  <p className="text-white font-semibold mb-1">{winner.full_name}</p>
                  <p className="text-slate-400 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {winner.department}
                  </p>
                  <p className="text-slate-400 text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {maskPhone(winner.phone)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            {currentWinnerIndex >= finalistsCount && (
              <div className="mt-5 flex gap-4">
                <Button 
                  onClick={resetTombola} 
                  variant="outline" 
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 h-12"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nuevo Sorteo
                </Button>
                <Button 
                  onClick={finishDraw} 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-12 font-semibold"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Guardar Resultados
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Footer */}
      <div className="relative z-10 px-6 lg:px-10 pb-8">
        <div className="flex flex-wrap justify-center gap-4 text-center">
          <div className="bg-[#0d2035]/80 rounded-xl px-6 py-4 border border-[#3a6a8a]/50 min-w-[120px]">
            <p className="text-3xl font-bold text-cyan-400">{coupons.length}</p>
            <p className="text-slate-400 text-xs uppercase tracking-wider mt-1">Cupones Activos</p>
          </div>
          <div className="bg-[#0d2035]/80 rounded-xl px-6 py-4 border border-amber-500/50 min-w-[120px]">
            <p className="text-3xl font-bold text-amber-400">{finalistsCount}</p>
            <p className="text-slate-400 text-xs uppercase tracking-wider mt-1">Ganadores a Elegir</p>
          </div>
          <div className="bg-[#0d2035]/80 rounded-xl px-6 py-4 border border-green-500/50 min-w-[120px]">
            <p className="text-3xl font-bold text-green-400">{winners.length}</p>
            <p className="text-slate-400 text-xs uppercase tracking-wider mt-1">Ya Seleccionados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
