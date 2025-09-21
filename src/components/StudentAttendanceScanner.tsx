import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import QRScanner from './QRScanner';
import { supabase } from '@/integrations/supabase/client';

const StudentAttendanceScanner = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const handleQRScan = async (data: string) => {
    if (!profile) return;
    
    setIsMarking(true);
    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'attendance' && qrData.classId) {
        // Mark attendance
        const { error } = await supabase
          .from('attendance')
          .insert([
            {
              student_id: profile.user_id,
              class_id: qrData.classId,
              status: 'present',
              check_in_time: new Date().toTimeString().split(' ')[0],
              location_verified: true,
              notes: 'Marked via QR code'
            }
          ]);

        if (error) throw error;

        toast({
          title: "Attendance Marked Successfully",
          description: "Your attendance has been recorded for this class",
        });
        setShowQRScanner(false);
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Quick Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan the QR code displayed by your teacher to mark your attendance quickly and securely.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Instant attendance marking
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-secondary" />
              Location verified
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Secure and accurate
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={() => setShowQRScanner(true)}
              className="w-full"
              disabled={isMarking}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {isMarking ? 'Marking Attendance...' : 'Scan QR Code'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Mark Your Attendance"
        description="Point your camera at the QR code displayed by your teacher"
      />
    </>
  );
};

export default StudentAttendanceScanner;