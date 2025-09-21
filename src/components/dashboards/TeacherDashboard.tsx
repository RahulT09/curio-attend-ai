import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, QrCode, Calendar, TrendingUp, Upload, Bell, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import QRScanner from '@/components/QRScanner';
import { useToast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  grade: string;
  section: string;
  student_count: number;
  attendance_today: number;
}

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    totalClasses: 0,
    avgAttendance: 0
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchTeacherData();
    }
  }, [profile]);

  const fetchTeacherData = async () => {
    try {
      // Fetch classes taught by this teacher
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade,
          section,
          student_classes(count)
        `)
        .eq('teacher_id', profile?.id);

      if (classesError) throw classesError;

      // Get attendance stats for today
      const today = new Date().toISOString().split('T')[0];
      const classIds = classesData?.map(c => c.id) || [];
      
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status, class_id')
        .in('class_id', classIds)
        .eq('date', today);

      // Transform classes data
      const transformedClasses = classesData?.map(cls => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,  
        section: cls.section,
        student_count: (cls.student_classes as any)?.length || 0,
        attendance_today: attendanceData?.filter(a => 
          a.class_id === cls.id && a.status === 'present'
        ).length || 0
      })) || [];

      setClasses(transformedClasses);

      // Calculate stats
      const totalStudents = transformedClasses.reduce((sum, cls) => sum + cls.student_count, 0);
      const todayAttendance = transformedClasses.reduce((sum, cls) => sum + cls.attendance_today, 0);
      const avgAttendance = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

      setStats({
        totalStudents,
        todayAttendance,
        totalClasses: transformedClasses.length,
        avgAttendance
      });

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (data: string) => {
    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'attendance' && qrData.student_id && qrData.class_id) {
        // Mark attendance
        const { error } = await supabase
          .from('attendance')
          .upsert({
            student_id: qrData.student_id,
            class_id: qrData.class_id,
            date: new Date().toISOString().split('T')[0],
            status: 'present',
            check_in_time: new Date().toTimeString().split(' ')[0],
            marked_by: profile?.id
          });

        if (error) throw error;

        toast({
          title: "Attendance Marked",
          description: "Student attendance has been recorded successfully",
        });

        // Refresh data
        fetchTeacherData();
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast({
        title: "Error",
        description: "Failed to process QR code scan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile?.first_name}!</h1>
          <p className="text-muted-foreground">Manage your classes and student attendance</p>
        </div>
        <Button onClick={() => setShowQRScanner(true)} className="gap-2">
          <QrCode className="w-4 h-4" />
          Scan QR Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold">{stats.todayAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {classes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No classes assigned yet</p>
              </div>
            ) : (
              classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Grade {cls.grade}{cls.section} • {cls.student_count} students
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Today's Attendance</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.attendance_today}/{cls.student_count} present
                      </p>
                    </div>
                    
                    <Badge 
                      variant={cls.attendance_today === cls.student_count ? "default" : "secondary"}
                    >
                      {cls.student_count > 0 
                        ? Math.round((cls.attendance_today / cls.student_count) * 100)
                        : 0
                      }%
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">QR Attendance</h3>
            <p className="text-sm text-muted-foreground">Scan QR codes for attendance</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold mb-1">Upload Materials</h3>
            <p className="text-sm text-muted-foreground">Share curriculum content</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-muted-foreground">View detailed reports</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold mb-1">Notifications</h3>
            <p className="text-sm text-muted-foreground">Send parent updates</p>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Attendance Scanner"
        description="Scan student QR codes to mark attendance"
      />
    </div>
  );
};

export default TeacherDashboard;