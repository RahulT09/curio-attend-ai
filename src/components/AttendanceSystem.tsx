import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  attendance_today?: string | null;
}

const AttendanceSystem = () => {
  const { profile } = useAuth();
  const { attendanceRecords, attendanceStats, markAttendance, getTodayAttendance } = useAttendance();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  // Fetch classes for teacher
  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchTeacherClasses();
    }
  }, [profile]);

  const fetchTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', profile?.id);

      if (error) throw error;
      setClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass]);

  const fetchClassStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_classes')
        .select(`
          student_id,
          profiles:student_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('class_id', selectedClass);

      if (error) throw error;

      const studentsData = data?.map(item => ({
        id: item.profiles?.id || '',
        first_name: item.profiles?.first_name || '',
        last_name: item.profiles?.last_name || ''
      })) || [];

      // Get today's attendance for these students
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', selectedClass)
        .eq('date', today);

      // Merge attendance data with student data
      const studentsWithAttendance = studentsData.map(student => ({
        ...student,
        attendance_today: attendanceData?.find(a => a.student_id === student.id)?.status || null
      }));

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    await markAttendance(studentId, selectedClass, status);
    // Refresh student list to show updated attendance
    fetchClassStudents();
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Timer className="w-4 h-4 text-yellow-500" />;
      case 'excused':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, any> = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      excused: 'outline'
    };

    return (
      <Badge variant={variants[status || ''] || 'outline'}>
        {status || 'Not Marked'}
      </Badge>
    );
  };

  if (profile?.role !== 'teacher') {
    return (
      <div className="space-y-6">
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">My Attendance</h2>
          <p className="text-muted-foreground">View your attendance history and statistics</p>
        </div>

        {attendanceStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                    <p className="text-2xl font-bold">{attendanceStats.total_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-500">{attendanceStats.present_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-500">{attendanceStats.absent_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Timer className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance %</p>
                    <p className="text-2xl font-bold text-primary">{attendanceStats.attendance_percentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendanceRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      {record.check_in_time && (
                        <p className="text-sm text-muted-foreground">
                          Check-in: {record.check_in_time}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Mark and manage student attendance</p>
        </div>
      </div>

      <div className="flex gap-4">
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Grade {cls.grade}{cls.section}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>
              Today's Attendance - {classes.find(c => c.id === selectedClass)?.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString()} • {students.length} students
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(student.attendance_today)}
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Student ID: {student.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(student.attendance_today)}
                    
                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant={student.attendance_today === 'present' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(student.id, 'present')}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance_today === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => handleMarkAttendance(student.id, 'absent')}
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={student.attendance_today === 'late' ? 'secondary' : 'outline'}
                        onClick={() => handleMarkAttendance(student.id, 'late')}
                      >
                        Late
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceSystem;