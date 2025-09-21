import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock, 
  Download,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  QrCode
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import QRScanner from "@/components/QRScanner";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const { profile } = useAuth();
  const { attendanceRecords, attendanceStats, loading } = useAttendance();
  const { toast } = useToast();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Real data from backend
  const stats = {
    attendanceRate: attendanceStats?.attendance_percentage || 0,
    completedAssignments: 15,
    totalAssignments: 18,
    upcomingClasses: 4,
    badges: 7
  };

  const recentActivity = [
    { type: 'attendance', subject: 'Mathematics', time: '2 hours ago', status: 'present' },
    { type: 'assignment', subject: 'Physics Lab Report', time: '1 day ago', status: 'completed' },
    { type: 'badge', subject: 'Perfect Attendance Week', time: '2 days ago', status: 'earned' },
    { type: 'class', subject: 'Chemistry', time: 'Tomorrow 9:00 AM', status: 'upcoming' }
  ];

  const todaysSchedule = [
    { time: '09:00 AM', subject: 'Mathematics', room: 'Room 101', type: 'lecture' },
    { time: '11:00 AM', subject: 'Physics Lab', room: 'Lab 205', type: 'practical' },
    { time: '02:00 PM', subject: 'Chemistry', room: 'Room 102', type: 'lecture' },
    { time: '04:00 PM', subject: 'Study Group', room: 'Library', type: 'group' }
  ];

  const assignments = [
    { title: 'Physics Lab Report', subject: 'Physics', due: '2 days', status: 'pending', priority: 'high' },
    { title: 'Math Problem Set 5', subject: 'Mathematics', due: '5 days', status: 'in-progress', priority: 'medium' },
    { title: 'Chemistry Quiz Prep', subject: 'Chemistry', due: '1 week', status: 'not-started', priority: 'low' }
  ];

  const handleQRScan = (data: string) => {
    try {
      const qrData = JSON.parse(data);
      if (qrData.type === 'attendance') {
        toast({
          title: "Attendance Marked",
          description: "Your attendance has been successfully recorded",
        });
        setShowQRScanner(false);
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid attendance QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground">Here's your academic progress overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">
            <Award className="w-3 h-3 mr-1" />
            {stats.badges} Badges Earned
          </Badge>
          <Button onClick={() => setShowQRScanner(true)} className="gap-2">
            <QrCode className="w-4 h-4" />
            Mark Attendance
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.attendanceRate.toFixed(1)}%</div>
            <div className="space-y-2 mt-2">
              <Progress value={stats.attendanceRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Excellent attendance!</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {stats.completedAssignments}/{stats.totalAssignments}
            </div>
            <div className="space-y-2 mt-2">
              <Progress value={(stats.completedAssignments / stats.totalAssignments) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">3 pending submissions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground mt-2">Next class in 2 hours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.badges}</div>
            <p className="text-xs text-muted-foreground mt-2">2 new badges this week</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Your classes and activities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysSchedule.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="text-sm font-medium text-primary min-w-20">{item.time}</div>
                      <div className="flex-1">
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.room}</p>
                      </div>
                      <Badge variant={item.type === 'practical' ? 'secondary' : 'outline'}>
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Assignments */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  Pending Assignments
                </CardTitle>
                <CardDescription>Stay on top of your coursework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${
                        assignment.priority === 'high' ? 'bg-destructive' :
                        assignment.priority === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject} • Due in {assignment.due}</p>
                      </div>
                      <Badge variant={
                        assignment.status === 'pending' ? 'destructive' :
                        assignment.status === 'in-progress' ? 'secondary' : 'outline'
                      }>
                        {assignment.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'present' || activity.status === 'completed' || activity.status === 'earned'
                          ? 'bg-success/10 text-success'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {activity.type === 'attendance' && <CheckCircle className="w-4 h-4" />}
                        {activity.type === 'assignment' && <BookOpen className="w-4 h-4" />}
                        {activity.type === 'badge' && <Award className="w-4 h-4" />}
                        {activity.type === 'class' && <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.subject}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Schedule
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Access Curriculum
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Progress Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Join Study Group
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Attendance QR Scanner"
        description="Scan the QR code to mark your attendance"
      />
    </div>
  );
};

export default StudentDashboard;