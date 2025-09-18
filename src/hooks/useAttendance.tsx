import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  check_in_time?: string;
  location_verified: boolean;
  marked_by?: string;
  notes?: string;
  created_at: string;
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
}

export const useAttendance = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);

  // Fetch attendance records for students or teachers
  const fetchAttendance = async (studentId?: string, classId?: string, dateRange?: { from: string; to: string }) => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let query = supabase.from('attendance').select(`
        *,
        student_profile:profiles!student_id (
          first_name,
          last_name
        ),
        class:classes!class_id (
          name,
          grade,
          section
        )
      `);

      // Role-based filtering
      if (profile.role === 'student') {
        query = query.eq('student_id', profile.id);
      } else if (profile.role === 'teacher' && classId) {
        query = query.eq('class_id', classId);
      } else if (profile.role === 'parent') {
        // Parents can see their children's attendance
        const { data: children } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', profile.id);
        
        if (children && children.length > 0) {
          const studentIds = children.map(c => c.student_id);
          query = query.in('student_id', studentIds);
        }
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceRecords(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance (for teachers)
  const markAttendance = async (
    studentId: string, 
    classId: string, 
    status: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ) => {
    if (!profile || profile.role !== 'teacher') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const checkInTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          class_id: classId,
          date: today,
          status,
          check_in_time: status === 'present' || status === 'late' ? checkInTime : null,
          marked_by: profile.id,
          notes,
          location_verified: true // For now, assume location is verified
        }, {
          onConflict: 'student_id,class_id,date'
        });

      if (error) throw error;

      toast({
        title: "Attendance marked",
        description: `Student marked as ${status}`,
      });

      // Refresh attendance records
      await fetchAttendance();

      // Send notification to parent if student is absent
      if (status === 'absent') {
        await sendAbsentNotification(studentId);
      }

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error marking attendance",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  // Send notification to parent when student is absent
  const sendAbsentNotification = async (studentId: string) => {
    try {
      // Get parent information
        const { data: parentStudent } = await supabase
        .from('parent_students')
        .select(`
          parent_id,
          parent_profile:profiles!parent_id (
            first_name,
            last_name
          ),
          student_profile:profiles!student_id (
            first_name,
            last_name
          )
        `)
        .eq('student_id', studentId)
        .single();

      if (parentStudent) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            recipient_id: parentStudent.parent_id,
            title: 'Student Absent',
            message: `Your child ${parentStudent.student_profile?.first_name} ${parentStudent.student_profile?.last_name} was marked absent today.`,
            type: 'attendance'
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error sending absent notification:', error);
    }
  };

  // Calculate attendance statistics
  const calculateStats = (records: AttendanceRecord[]) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    setAttendanceStats({
      total_days: total,
      present_days: present,
      absent_days: absent,
      late_days: late,
      attendance_percentage: percentage
    });
  };

  // Get today's attendance for a class (for teachers)
  const getTodayAttendance = async (classId: string) => {
    if (!profile || profile.role !== 'teacher') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
        const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student_profile:profiles!student_id (
            first_name,
            last_name
          )
        `)
        .eq('class_id', classId)
        .eq('date', today);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
      return [];
    }
  };

  useEffect(() => {
    if (profile) {
      fetchAttendance();
    }
  }, [profile]);

  return {
    attendanceRecords,
    attendanceStats,
    loading,
    fetchAttendance,
    markAttendance,
    getTodayAttendance,
  };
};