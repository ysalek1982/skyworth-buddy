import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy el Asistente Skyworth 2026. ¿En qué te puedo ayudar hoy? Pregúntame sobre la promoción, cómo participar, los premios o cualquier duda que tengas.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Respuestas predefinidas para el demo
  const getResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("participar") || message.includes("cómo") || message.includes("como")) {
      return "¡Es muy fácil participar! Solo necesitas: 1) Comprar un TV Skyworth en tiendas autorizadas, 2) Registrar tu compra en nuestra web subiendo tu factura, 3) ¡Listo! Recibirás tus tickets para el sorteo del viaje al Mundial 2026.";
    }
    
    if (message.includes("premio") || message.includes("ganar") || message.includes("viaje")) {
      return "El premio principal es un viaje todo incluido al Mundial 2026, que incluye: vuelos, hospedaje, entradas a partidos y gastos de estadía. ¡Una experiencia única para vivir el fútbol!";
    }
    
    if (message.includes("tv") || message.includes("modelo") || message.includes("producto")) {
      return "Participan todos los TVs Skyworth: 32\" (1 ticket), 43\"-50\" (2 tickets), 55\"-65\" (3 tickets). ¡Mientras más grande tu TV, más oportunidades de ganar!";
    }
    
    if (message.includes("tienda") || message.includes("donde") || message.includes("comprar")) {
      return "Puedes comprar tu TV Skyworth en cualquiera de nuestras tiendas autorizadas a nivel nacional. Consulta la lista completa en nuestra sección de tiendas.";
    }
    
    if (message.includes("sorteo") || message.includes("fecha") || message.includes("cuando")) {
      return "El gran sorteo será el 15 de julio de 2026. ¡No te lo pierdas! Mientras tanto, acumula todos los tickets que puedas registrando tus compras.";
    }
    
    return "Gracias por tu pregunta. Para más información sobre la promoción, te invito a explorar nuestra página o contactarnos directamente. ¿Hay algo más en lo que pueda ayudarte?";
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    // Simular delay de respuesta
    await new Promise(resolve => setTimeout(resolve, 1000));

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getResponse(currentInput),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-gold shadow-glow-gold flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="flex items-center justify-center"
            >
              <X className="w-7 h-7 text-skyworth-dark" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="flex items-center justify-center"
            >
              <Bot className="w-7 h-7 text-skyworth-dark" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] md:w-[400px] h-[500px] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-muted border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Asistente Skyworth</h3>
                  <p className="text-xs text-muted-foreground">Campaña Mundial 2026</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`chat-bubble ${message.role === "user" ? "user" : "bot"}`}>
                    <div className="flex items-start gap-2">
                      {message.role === "assistant" && (
                        <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.role === "user" && (
                        <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="chat-bubble bot">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Escribiendo...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta..."
                  disabled={isTyping}
                  className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
