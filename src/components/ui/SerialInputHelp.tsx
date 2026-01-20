import { useState } from "react";
import { Tv, HelpCircle, AlertTriangle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SERIAL_EXAMPLE, SERIAL_EXAMPLE_WITH_DASH, MODEL_EXAMPLE } from "@/lib/serialUtils";

interface SerialInputHelpProps {
  variant?: 'light' | 'dark';
}

export function SerialInputHelp({ variant = 'dark' }: SerialInputHelpProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const textColor = variant === 'dark' ? 'text-cyan-400' : 'text-primary';
  const mutedColor = variant === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground';

  return (
    <>
      {/* Always visible help text below input */}
      <div className={`text-xs ${textColor} space-y-1 mt-1`}>
        <p className="flex items-center gap-1">
          <Tv className="w-3 h-3 flex-shrink-0" />
          <span>
            Ingresa el serial tal como aparece bajo el código de barras, <strong className="text-amber-400">sin guiones (-)</strong>.
          </span>
        </p>
        <p className={mutedColor}>
          Ej: <span className="font-mono font-bold text-white">{SERIAL_EXAMPLE}</span>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="ml-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
          >
            <HelpCircle className="w-3 h-3" />
            ¿Dónde lo encuentro?
          </button>
        </p>
      </div>

      {/* Modal with detailed help */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
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

            {/* Format example */}
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Formato correcto</h4>
              <p className="font-mono text-lg font-bold text-white">{SERIAL_EXAMPLE}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Solo letras y números, sin guiones ni espacios.
              </p>
            </div>

            {/* Common mistake - dash */}
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                ¡Ojo con el guión!
              </h4>
              <p className="text-sm text-muted-foreground">
                Algunas etiquetas muestran el serial con guión:
              </p>
              <p className="font-mono text-lg text-amber-300 line-through">{SERIAL_EXAMPLE_WITH_DASH}</p>
              <p className="text-sm text-white mt-2">
                Debes ingresarlo <strong>SIN el guión</strong>:
              </p>
              <p className="font-mono text-lg font-bold text-green-400">{SERIAL_EXAMPLE}</p>
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
