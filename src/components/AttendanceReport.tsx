import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';

const AttendanceReport = () => {
  const { profile } = useAuth();
  const { attendanceRecords, attendanceStats, loading, fetchAttendance } = useAttendance();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    if (profile) {
      fetchAttendance();
    }
  }, [profile, selectedPeriod]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'late':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'excused':
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      excused: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading attendance data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats?.total_days || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{attendanceStats?.present_days || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{attendanceStats?.absent_days || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {attendanceStats?.attendance_percentage?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={attendanceStats?.attendance_percentage || 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance History</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      {record.check_in_time && (
                        <p className="text-sm text-muted-foreground">
                          Check-in: {record.check_in_time}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-xs text-muted-foreground">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(record.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options - moved to header */}
    </div>
  );
};

export default AttendanceReport;