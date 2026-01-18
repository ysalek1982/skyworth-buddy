import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy, Sparkles, RotateCcw, PartyPopper, User, MapPin, CreditCard } from 'lucide-react';
import logoAj from '@/assets/logo-aj.png';

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
    
    // Initialize display codes
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
    if (coupons.length === 0) return 'SKY-XXXXX';
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
    const maxSpins = 30 + Math.floor(Math.random() * 20); // 30-50 spins
    
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
    }, 80 - (spinCount * 1.5)); // Gradually slow down

    // Slow down effect
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Final slower spins
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
    // Pick a random winner from remaining coupons
    const remainingCoupons = coupons.filter(
      c => !winners.some(w => w.code === c.code)
    );

    if (remainingCoupons.length === 0) {
      toast.error('No quedan cupones disponibles');
      setIsSpinning(false);
      return;
    }

    const winnerCoupon = remainingCoupons[Math.floor(Math.random() * remainingCoupons.length)];
    
    // Fetch winner details
    if (winnerCoupon.buyer_purchase_id) {
      const { data: purchase } = await supabase
        .from('client_purchases')
        .select('full_name, dni, city, email, phone')
        .eq('id', winnerCoupon.buyer_purchase_id)
        .single();

      if (purchase) {
        const winner: Winner = {
          code: winnerCoupon.code,
          full_name: purchase.full_name,
          dni: purchase.dni,
          city: purchase.city || 'No especificada',
          email: purchase.email,
          phone: purchase.phone
        };

        // Set final display with winner in center
        setDisplayCodes([
          getRandomCode(),
          getRandomCode(),
          winnerCoupon.code,
          getRandomCode(),
          getRandomCode()
        ]);

        // Show winner reveal after a short delay
        setTimeout(() => {
          setCurrentWinner(winner);
          setShowWinnerReveal(true);
          setWinners(prev => [...prev, winner]);
          setCurrentWinnerIndex(prev => prev + 1);
          setIsSpinning(false);
        }, 500);
      }
    } else {
      // Fallback if no purchase linked
      const winner: Winner = {
        code: winnerCoupon.code,
        full_name: 'Participante',
        dni: 'N/A',
        city: 'N/A',
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

  return (
    <div className="relative min-h-[600px] rounded-2xl overflow-hidden">
      {/* Stadium Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'linear-gradient(to bottom, rgba(7, 26, 46, 0.7), rgba(7, 26, 46, 0.9)), url("/placeholder.svg")',
          backgroundColor: 'hsl(210, 70%, 10%)'
        }}
      />
      
      {/* Confetti Animation */}
      <AnimatePresence>
        {showWinnerReveal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B00', '#00BFFF', '#FF1493', '#00FF7F'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: -20
                }}
                animate={{
                  y: [0, 600],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center gap-8">
        {/* Logo Side */}
        <div className="flex-shrink-0">
          <motion.div
            animate={{ 
              scale: isSpinning ? [1, 1.05, 1] : 1,
            }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.5 }}
            className="relative"
          >
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center border-4 border-white/30 shadow-2xl">
              <div className="text-center p-4">
                <img src={logoAj} alt="Logo" className="h-16 mx-auto mb-2" />
                <h2 className="text-white font-bold text-lg">EL SUEÑO</h2>
                <h3 className="text-amber-400 font-bold text-xl">DEL HINCHA</h3>
                <p className="text-white/80 text-xs mt-1">SKYWORTH</p>
              </div>
            </div>
            {isSpinning && (
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-amber-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>

        {/* Tombola Display */}
        <div className="flex-1 w-full max-w-md">
          <AnimatePresence mode="wait">
            {!showWinnerReveal ? (
              <motion.div
                key="tombola"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-cyan-500/50 backdrop-blur-sm overflow-hidden">
                  {/* Slot Machine Display */}
                  <div className="relative p-6">
                    {/* Highlight overlay */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-14 bg-gradient-to-r from-cyan-500/20 via-cyan-400/30 to-cyan-500/20 border-y-2 border-cyan-400 z-10 pointer-events-none" />
                    
                    <div className="space-y-1 py-4">
                      {displayCodes.map((code, index) => (
                        <motion.div
                          key={`${index}-${code}`}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ 
                            opacity: index === 2 ? 1 : 0.4,
                            y: 0,
                            scale: index === 2 ? 1.1 : 1
                          }}
                          className={`text-center py-2 font-mono text-xl tracking-widest transition-all ${
                            index === 2 
                              ? 'text-amber-400 font-bold text-2xl' 
                              : 'text-white/60'
                          }`}
                        >
                          {code}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Spin Button */}
                  <div className="p-4 bg-slate-900/50">
                    <Button
                      onClick={spinTombola}
                      disabled={isSpinning || currentWinnerIndex >= finalistsCount}
                      className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 disabled:opacity-50"
                    >
                      {isSpinning ? (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-6 w-6" />
                          GIRANDO...
                        </motion.span>
                      ) : currentWinnerIndex >= finalistsCount ? (
                        <span className="flex items-center gap-2">
                          <Trophy className="h-6 w-6" />
                          SORTEO COMPLETO
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <RotateCcw className="h-6 w-6" />
                          GIRAR ({currentWinnerIndex + 1}/{finalistsCount})
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
              >
                <Card className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-amber-500/50 backdrop-blur-sm overflow-hidden">
                  {/* Winner Header */}
                  <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-500 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="flex items-center justify-center gap-2"
                    >
                      <PartyPopper className="h-6 w-6 text-white" />
                      <span className="text-white font-bold text-lg">¡NÚMERO GANADOR!</span>
                      <PartyPopper className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Winner Code */}
                  <div className="p-6 text-center border-b border-cyan-500/30">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="inline-block bg-gradient-to-r from-cyan-600 to-cyan-500 px-8 py-3 rounded-lg"
                    >
                      <span className="font-mono font-bold text-3xl text-white tracking-widest">
                        {currentWinner?.code}
                      </span>
                    </motion.div>
                  </div>

                  {/* Winner Details */}
                  <div className="p-6 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-start gap-3"
                    >
                      <User className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-cyan-400 text-sm">Ganador:</p>
                        <p className="text-white font-bold text-xl">{currentWinner?.full_name}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex items-start gap-3"
                    >
                      <CreditCard className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-cyan-400 text-sm">Carnet de Identidad:</p>
                        <p className="text-white font-bold text-lg">{currentWinner?.dni}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="flex items-start gap-3"
                    >
                      <MapPin className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-cyan-400 text-sm">Ciudad:</p>
                        <p className="text-white font-bold text-lg">{currentWinner?.city}</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Continue Button */}
                  <div className="p-4 bg-slate-900/50">
                    <Button
                      onClick={() => setShowWinnerReveal(false)}
                      disabled={currentWinnerIndex >= finalistsCount}
                      className="w-full h-12 font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
                    >
                      {currentWinnerIndex < finalistsCount ? (
                        <span className="flex items-center gap-2">
                          <RotateCcw className="h-5 w-5" />
                          Siguiente Ganador ({currentWinnerIndex}/{finalistsCount})
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Ver Todos los Ganadores
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
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
          className="relative z-10 px-8 pb-8"
        >
          <Card className="bg-slate-800/90 border border-amber-500/30 p-4">
            <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ganadores Seleccionados ({winners.length}/{finalistsCount})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-900/50 rounded-lg p-3 border border-cyan-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500 text-white">#{index + 1}</Badge>
                    <span className="font-mono text-cyan-400 text-sm">{winner.code}</span>
                  </div>
                  <p className="text-white font-medium text-sm">{winner.full_name}</p>
                  <p className="text-slate-400 text-xs">{winner.city}</p>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            {currentWinnerIndex >= finalistsCount && (
              <div className="mt-4 flex gap-3">
                <Button onClick={resetTombola} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nuevo Sorteo
                </Button>
                <Button onClick={finishDraw} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                  <Trophy className="h-4 w-4 mr-2" />
                  Guardar Resultados
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="relative z-10 px-8 pb-8">
        <div className="flex justify-center gap-4 text-center">
          <div className="bg-slate-800/50 rounded-lg px-6 py-3 border border-slate-600">
            <p className="text-2xl font-bold text-cyan-400">{coupons.length}</p>
            <p className="text-slate-400 text-sm">Cupones Activos</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg px-6 py-3 border border-slate-600">
            <p className="text-2xl font-bold text-amber-400">{finalistsCount}</p>
            <p className="text-slate-400 text-sm">Ganadores a Elegir</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg px-6 py-3 border border-slate-600">
            <p className="text-2xl font-bold text-green-400">{winners.length}</p>
            <p className="text-slate-400 text-sm">Ya Seleccionados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
