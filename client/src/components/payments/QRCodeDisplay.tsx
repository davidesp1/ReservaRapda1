import React from "react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

interface QRCodeDisplayProps {
  entity: string;
  reference: string;
  amount: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  entity,
  reference,
  amount,
}) => {
  // Formatar para incluir todos os detalhes no QR code e código de barras
  const mbPayload = `MB:${entity}:${reference.replace(/\s/g, '')}:${amount.toFixed(2)}`;
  
  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="relative">
            <QRCodeSVG 
              value={mbPayload} 
              size={180} 
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 px-2 py-1 rounded text-xs font-medium">
                Multibanco
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Código de barras */}
      <div className="flex justify-center my-4">
        <div className="bg-white border border-gray-200 p-2 rounded-lg">
          <Barcode 
            value={entity + reference.replace(/\s/g, '')} 
            format="CODE128"
            width={1.5}
            height={50}
            displayValue={true}
            font="monospace"
            fontSize={12}
            margin={5}
            textMargin={2}
          />
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
