import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Bell, BookOpen, TrendingUp, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChildData {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  grade: string;
  section: string;
  attendance_today?: string;
  attendance_stats?: {
    total_days: number;
    present_days: number;
    attendance_percentage: number;
  };
}

const ParentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchParentData();
    }
  }, [profile]);

  const fetchParentData = async () => {
    try {
      // Fetch children data
      const { data: childrenData, error: childrenError } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          profiles!parent_students_student_id_fkey (
            id,
            user_id,
            first_name,
            last_name
          )
        `)
        .eq('parent_id', profile?.user_id);

      if (childrenError) throw childrenError;

      if (childrenData && childrenData.length > 0) {
        const childrenWithClasses = await Promise.all(
          childrenData.map(async (child) => {
            const studentId = child.profiles?.user_id;
            
            // Get student's class
            const { data: classData } = await supabase
              .from('student_classes')
              .select(`
                classes (
                  name,
                  grade,
                  section
                )
              `)
              .eq('student_id', studentId)
              .single();

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            const { data: attendanceToday } = await supabase
              .from('attendance')
              .select('status')
              .eq('student_id', studentId)
              .eq('date', today)
              .single();

            // Get attendance stats
            const { data: attendanceStats } = await supabase
              .from('attendance')
              .select('status')
              .eq('student_id', studentId);

            const totalDays = attendanceStats?.length || 0;
            const presentDays = attendanceStats?.filter(a => a.status === 'present').length || 0;
            const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            return {
              id: child.profiles?.id || '',
              first_name: child.profiles?.first_name || '',
              last_name: child.profiles?.last_name || '',
              class_name: classData?.classes?.name || 'Not assigned',
              grade: classData?.classes?.grade || '',
              section: classData?.classes?.section || '',
              attendance_today: attendanceToday?.status,
              attendance_stats: {
                total_days: totalDays,
                present_days: presentDays,
                attendance_percentage: attendancePercentage
              }
            };
          })
        );

        setChildren(childrenWithClasses);
      }

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setNotifications(notificationsData || []);

    } catch (error) {
      console.error('Error fetching parent data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceIcon = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'excused':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAttendanceBadge = (status: string | undefined) => {
    const variants: Record<string, any> = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      excused: 'outline'
    };

    return (
      <Badge variant={variants[status || ''] || 'outline'}>
        {status || 'Not marked'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground">Monitor your children's progress and activities</p>
      </div>

      {/* Children Cards */}
      <div className="grid gap-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No children found in the system</p>
            </CardContent>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {child.class_name} - Grade {child.grade}{child.section}
                      </p>
                    </div>
                  </div>
                  {getAttendanceBadge(child.attendance_today)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Today's Attendance */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {getAttendanceIcon(child.attendance_today)}
                    <div>
                      <p className="text-sm font-medium">Today's Status</p>
                      <p className="text-xs text-muted-foreground">
                        {child.attendance_today || 'Not marked'}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Stats */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Attendance Rate</p>
                      <p className="text-xs text-muted-foreground">
                        {child.attendance_stats?.attendance_percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Days Present */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Days Present</p>
                      <p className="text-xs text-muted-foreground">
                        {child.attendance_stats?.present_days}/{child.attendance_stats?.total_days}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Progress
                  </Button>
                  <Button size="sm" variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Request Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-4">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;