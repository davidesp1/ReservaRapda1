import React from 'react';

interface QRCodeDisplayProps {
  entity: string;
  reference: string;
  amount: number;
}

// Este componente simula a geração de um QR code e código de barras para Multibanco
// Em uma implementação real, você usaria uma biblioteca como qrcode.react
const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ entity, reference, amount }) => {
  // Criar um SVG simulado para o QR code com as informações do pagamento
  const qrSize = 128;
  const cellSize = 4;
  const cells = qrSize / cellSize;
  
  // Gerar um padrão aleatório mas consistente para o QR code baseado nos dados
  const generatePattern = () => {
    const seed = entity + reference + amount;
    const pattern = [];
    
    for (let i = 0; i < cells; i++) {
      const row = [];
      for (let j = 0; j < cells; j++) {
        // Bordas do QR code sempre são quadrados sólidos
        if (
          (i < 7 && j < 7) || // Canto superior esquerdo
          (i < 7 && j >= cells - 7) || // Canto superior direito
          (i >= cells - 7 && j < 7) // Canto inferior esquerdo
        ) {
          // Criar os quadrados de alinhamento nas bordas
          if (
            (i === 0 || i === 6 || i === cells - 7 || i === cells - 1) ||
            (j === 0 || j === 6 || j === cells - 7 || j === cells - 1) ||
            (i > 1 && i < 5 && j > 1 && j < 5) ||
            (i > 1 && i < 5 && j > cells - 6 && j < cells - 2) ||
            (i > cells - 6 && i < cells - 2 && j > 1 && j < 5)
          ) {
            row.push(1);
          } else {
            row.push(0);
          }
        } else {
          // Para o resto do QR code, usar um padrão pseudoaleatório mas consistente
          const index = i * cells + j;
          const charIndex = index % seed.length;
          row.push(seed.charCodeAt(charIndex) % 2);
        }
      }
      pattern.push(row);
    }
    
    return pattern;
  };
  
  const pattern = generatePattern();
  
  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="bg-white border border-gray-200 p-3 rounded">
          <div className="relative w-32 h-32 bg-white flex items-center justify-center">
            <svg width={qrSize} height={qrSize} viewBox={`0 0 ${qrSize} ${qrSize}`}>
              {pattern.map((row, i) => 
                row.map((cell, j) => 
                  cell ? 
                    <rect 
                      key={`${i}-${j}`} 
                      x={j * cellSize} 
                      y={i * cellSize} 
                      width={cellSize} 
                      height={cellSize} 
                      fill="black" 
                    /> 
                    : null
                )
              )}
            </svg>
            
            {/* Texto sobreposto no meio */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-1 rounded text-xs">
                Pagar com Multibanco
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Código de barras */}
      <div className="w-full h-16 bg-white flex items-center justify-center border border-gray-200 rounded">
        <svg width="240" height="50" viewBox="0 0 240 50">
          {/* Gerar um código de barras simulado */}
          {Array.from({ length: 30 }, (_, i) => {
            const width = (i % 3 === 0) ? 3 : 1;
            const space = i * 8;
            const height = 40;
            return (
              <rect 
                key={i} 
                x={space} 
                y={5} 
                width={width} 
                height={height} 
                fill="black" 
              />
            );
          })}
          
          {/* Texto do código de barras */}
          <text x="120" y="48" fontSize="10" textAnchor="middle">
            {entity} | {reference.replace(/\s/g, ' ')} | €{amount.toFixed(2)}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default QRCodeDisplay;