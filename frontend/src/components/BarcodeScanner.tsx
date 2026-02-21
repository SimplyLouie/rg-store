import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isSecureContext, setIsSecureContext] = useState(true);
  const containerId = 'barcode-scanner-container';

  // Check for secure context (HTTPS/Localhost)
  useEffect(() => {
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    setIsSecureContext(isSecure);
    if (!isSecure) {
      setError('Camera access requires HTTPS or localhost. Please ensure you are visiting via an encrypted connection.');
    }
  }, []);

  const fetchCameras = useCallback(async () => {
    if (!isSecureContext) return;
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));

        // Only set initial camera if none is selected yet
        setSelectedCameraId(prev => {
          if (prev && devices.some(d => d.id === prev)) return prev;

          // Priority order for labels
          const priorityKeywords = ['back', 'environment', 'rear', 'exterior', 'iphone', 'continuity', 'droidcam', 'iriun'];

          const prioritized = devices.find(d =>
            priorityKeywords.some(keyword => d.label.toLowerCase().includes(keyword))
          );

          return prioritized ? prioritized.id : devices[0].id;
        });
      } else {
        setError('No cameras found on this device.');
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission.');
    } finally {
      setIsStarting(false);
    }
  }, []);

  // Initialize scanner and get cameras
  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    fetchCameras();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, [fetchCameras]);

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

        // Use facingMode for mobile devices if labels are generic or no cameras found with specific labels
        const cameraConfig = selectedCameraId
          ? selectedCameraId
          : { facingMode: "environment" };

        await scannerRef.current?.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
              return { width: size, height: size * 0.6 };
            }
          },
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
          {cameras.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Camera Source</label>
                <button
                  onClick={fetchCameras}
                  className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Refresh
                </button>
              </div>
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
                  <Camera className="h-4 w-4" />
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

          <div
            id={containerId}
            className={`rounded-lg overflow-hidden shadow-inner bg-black min-h-[250px] ${error ? 'hidden' : 'block'}`}
          />

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
