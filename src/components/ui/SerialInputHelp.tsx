import { useState } from "react";
import { Tv, HelpCircle, AlertTriangle, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SERIAL_EXAMPLE, SERIAL_EXAMPLE_WITH_DASH, MODEL_EXAMPLE } from "@/lib/serialUtils";

interface SerialInputHelpProps {
  variant?: 'light' | 'dark';
}

export function SerialInputHelp({ variant = 'dark' }: SerialInputHelpProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // High contrast colors for dark backgrounds
  const textColor = variant === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const exampleColor = variant === 'dark' ? 'text-amber-400' : 'text-amber-600';
  const linkColor = variant === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-500';

  return (
    <>
      {/* Always visible help text below input - HIGH CONTRAST */}
      <div className={`text-xs space-y-1 mt-2 p-3 rounded-lg ${variant === 'dark' ? 'bg-slate-800/80 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
        <p className={`flex items-center gap-2 ${textColor}`}>
          <Tv className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span className="font-medium">
            El número de serie determina los puntos (modelo del TV).
          </span>
        </p>
        <p className={`${textColor} ml-6`}>
          Ejemplo: <span className={`font-mono font-bold text-base ${exampleColor}`}>{SERIAL_EXAMPLE}</span>
          <span className="text-amber-500 ml-2 font-semibold">(sin guiones)</span>
        </p>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className={`ml-6 inline-flex items-center gap-1 ${linkColor} underline font-medium`}
        >
          <HelpCircle className="w-3 h-3" />
          ¿Dónde lo encuentro?
        </button>
      </div>

      {/* Modal with detailed help */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-cyan-400" />
              ¿Cómo encontrar tu Número de Serie?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Guía rápida para ubicar el serial de tu TV Skyworth
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Where to find it */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">📍 ¿Dónde encontrarlo?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• En la <strong className="text-white">etiqueta trasera del TV</strong> (debajo del código de barras)</li>
                <li>• En tu <strong className="text-white">Póliza de Garantía</strong></li>
                <li>• En la caja del producto</li>
              </ul>
            </div>

            {/* Visual example - Etiqueta */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Ejemplo de etiqueta
              </h4>
              <div className="bg-white rounded-md p-3 text-center">
                <p className="text-xs text-gray-500 mb-2">Así se ve en la etiqueta:</p>
                <p className="font-mono text-2xl text-gray-800 font-bold tracking-wider border-b-2 border-dashed border-gray-300 pb-2">
                  <span className="text-gray-700">2540415M</span>
                  <span className="text-red-500 font-extrabold">-</span>
                  <span className="text-gray-700">00039</span>
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Nota el guión en medio
                </p>
              </div>
            </div>

            {/* Common mistake - dash */}
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                ¡Importante! No incluyas el guión
              </h4>
              <p className="text-sm text-muted-foreground">
                Algunas etiquetas muestran el serial con guión:
              </p>
              <p className="font-mono text-lg text-amber-300 line-through my-2">{SERIAL_EXAMPLE_WITH_DASH}</p>
              <p className="text-sm text-white">
                Debes ingresarlo <strong className="text-green-400">SIN el guión</strong>:
              </p>
              <p className="font-mono text-xl font-bold text-green-400 mt-1">{SERIAL_EXAMPLE}</p>
            </div>

            {/* Format example */}
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Formato correcto</h4>
              <p className="font-mono text-xl font-bold text-white">{SERIAL_EXAMPLE}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Solo letras y números, sin guiones ni espacios.
              </p>
            </div>

            {/* Don't confuse with model */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <X className="w-4 h-4" />
                No confundir con el MODELO
              </h4>
              <p className="text-sm text-muted-foreground">
                El modelo se ve así: <span className="font-mono text-red-300">{MODEL_EXAMPLE}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                El modelo es más corto y generalmente empieza con un número (tamaño de pantalla).
                El serial es más largo y combina letras y números de forma diferente.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SerialInputHelp;
