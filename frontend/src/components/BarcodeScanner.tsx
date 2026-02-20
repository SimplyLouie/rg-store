import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { X, Camera, RefreshCw } from 'lucide-react';

interface CameraDevice {
  id: string;
  label: string;
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const containerId = 'barcode-scanner-container';

  // Initialize scanner and get cameras
  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          // Prefer environment/back camera if available, otherwise first camera
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          const initialId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCameraId(initialId);
        } else {
          setError('No cameras found on this device.');
          setIsStarting(false);
        }
      })
      .catch(() => {
        setError('Camera access denied. Please allow camera permission.');
        setIsStarting(false);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  // Start/Restart scanner when selectedCameraId changes
  useEffect(() => {
    if (!selectedCameraId || !scannerRef.current) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }

        await scannerRef.current?.start(
          selectedCameraId,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            scannerRef.current?.stop().catch(() => { });
          },
          undefined
        );
        setIsStarting(false);
      } catch (err: any) {
        console.error('Scanner error:', err);
        setError(err?.message || 'Failed to start camera.');
        setIsStarting(false);
      }
    };

    startScanner();
  }, [selectedCameraId, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-semibold">Scan Barcode</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-blue-700 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {/* Camera Selection Dropdown */}
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Switch Camera</label>
              <div className="relative">
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <RefreshCw className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}

          {isStarting && (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm">Accessing camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <Camera className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-red-500 text-sm font-medium mb-1">Camera Error</p>
              <p className="text-gray-500 text-xs px-2 line-clamp-3">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-4">
                Retry Permission
              </Button>
            </div>
          )}

          <div id={containerId} className={(error || isStarting) ? 'hidden' : 'rounded-lg overflow-hidden shadow-inner bg-black'} />

          {!error && !isStarting && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Point camera at barcode to scan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
