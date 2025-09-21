import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Calendar, TrendingUp, School, UserCheck, Bell, Settings, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  attendanceToday: number;
  avgAttendanceRate: number;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    attendanceToday: 0,
    avgAttendanceRate: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch user counts by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      const studentCount = profiles?.filter(p => p.role === 'student').length || 0;
      const teacherCount = profiles?.filter(p => p.role === 'teacher').length || 0;
      const parentCount = profiles?.filter(p => p.role === 'parent').length || 0;

      // Fetch total classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id');

      const totalClasses = classes?.length || 0;

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceToday } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      const presentToday = attendanceToday?.filter(a => a.status === 'present').length || 0;
      const totalAttendanceToday = attendanceToday?.length || 0;
      const avgAttendanceRate = totalAttendanceToday > 0 
        ? Math.round((presentToday / totalAttendanceToday) * 100) 
        : 0;

      setStats({
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalParents: parentCount,
        totalClasses,
        attendanceToday: presentToday,
        avgAttendanceRate
      });

      // Fetch recent activities (attendance records)
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:student_id (first_name, last_name),
          classes (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivities(recentAttendance || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete institution management and analytics</p>
        </div>
        <Button className="gap-2">
          <Settings className="w-4 h-4" />
          System Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Parents</p>
                <p className="text-2xl font-bold">{stats.totalParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold">{stats.attendanceToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-2xl font-bold">{stats.avgAttendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold mb-1">User Management</h3>
            <p className="text-sm text-muted-foreground">Manage students, teachers, and parents</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <School className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold mb-1">School Setup</h3>
            <p className="text-sm text-muted-foreground">Configure classes and subjects</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-muted-foreground">View detailed reports and insights</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold mb-1">System Settings</h3>
            <p className="text-sm text-muted-foreground">Configure system preferences</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent activities</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {activity.profiles?.first_name} {activity.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.classes?.name} • {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.status === 'present' ? 'default' : 'destructive'}>
                    {activity.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;