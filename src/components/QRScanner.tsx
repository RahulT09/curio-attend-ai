import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
  description?: string;
}

const QRScanner = ({ onScan, onClose, isOpen, title = "QR Code Scanner", description = "Scan a QR code" }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  // Simple QR code detection simulation
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate QR code detection for demo
    // In a real app, you'd use a QR code library like jsQR
    const simulatedData = generateSimulatedQRData();
    if (simulatedData && simulatedData !== lastScanned) {
      setLastScanned(simulatedData);
      onScan(simulatedData);
      stopCamera();
      
      toast({
        title: "QR Code Scanned",
        description: "Successfully scanned QR code",
      });
    }
  };

  const generateSimulatedQRData = () => {
    // Simulate finding QR codes occasionally for demo purposes
    const random = Math.random();
    if (random < 0.3) {
      const types = ['attendance', 'student', 'class'];
      const type = types[Math.floor(Math.random() * types.length)];
      const id = Math.random().toString(36).substring(2, 8);
      return JSON.stringify({ type, id, timestamp: Date.now() });
    }
    return null;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning && videoRef.current) {
      interval = setInterval(scanQRCode, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, lastScanned]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <CardTitle>{title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-4 border-primary/30 rounded-lg">
                    <div className="absolute inset-4 border-2 border-primary border-dashed rounded-lg animate-pulse" />
                  </div>
                  
                  {/* Corner guides */}
                  <div className="absolute top-8 left-8 w-6 h-6 border-l-4 border-t-4 border-primary" />
                  <div className="absolute top-8 right-8 w-6 h-6 border-r-4 border-t-4 border-primary" />
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-l-4 border-b-4 border-primary" />
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-r-4 border-b-4 border-primary" />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Camera className="w-12 h-12 mb-2" />
                  <p className="text-sm">Camera not active</p>
                </div>
              )}
            </div>

            {/* Status and Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                {isScanning ? (
                  <Badge variant="default" className="gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Scanning...
                  </Badge>
                ) : (
                  <Badge variant="outline">Camera Inactive</Badge>
                )}
              </div>

              {lastScanned && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Last Scanned</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">
                    {lastScanned}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                )}
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;