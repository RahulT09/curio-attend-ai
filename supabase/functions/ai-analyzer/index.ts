import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userRole, analysisType = 'attendance', timeframe = '30days' } = await req.json();
    
    if (!userId || !userRole) {
      throw new Error('User ID and role are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'semester':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get user profile first
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    let analysisData = '';
    let chartData = [];

    if (analysisType === 'attendance') {
      // Fetch attendance data based on role
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          date, 
          status,
          profiles:student_id (first_name, last_name),
          classes:class_id (name, grade, section)
        `)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (userRole === 'student') {
        attendanceQuery = attendanceQuery.eq('student_id', profile.id);
      } else if (userRole === 'teacher') {
        // Get classes taught by this teacher
        const { data: classes } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', profile.id);
        
        if (classes && classes.length > 0) {
          const classIds = classes.map(c => c.id);
          attendanceQuery = attendanceQuery.in('class_id', classIds);
        }
      } else if (userRole === 'parent') {
        // Get children of this parent
        const { data: children } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', profile.id);
        
        if (children && children.length > 0) {
          const studentIds = children.map(c => c.student_id);
          attendanceQuery = attendanceQuery.in('student_id', studentIds);
        }
      } else if (userRole === 'admin') {
        // Admin sees all attendance data
      }

      const { data: attendance } = await attendanceQuery;

      if (attendance && attendance.length > 0) {
        // Calculate statistics
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const percentage = Math.round((present / total) * 100);

        // Group by week for chart data
        const weeklyData = {};
        attendance.forEach(record => {
          const week = getWeekOfYear(new Date(record.date));
          if (!weeklyData[week]) {
            weeklyData[week] = { present: 0, absent: 0, late: 0, total: 0 };
          }
          weeklyData[week][record.status]++;
          weeklyData[week].total++;
        });

        chartData = Object.keys(weeklyData).map(week => ({
          week: `Week ${week}`,
          attendance: Math.round((weeklyData[week].present / weeklyData[week].total) * 100),
          present: weeklyData[week].present,
          absent: weeklyData[week].absent,
          late: weeklyData[week].late
        }));

        analysisData = `Attendance Analysis (${timeframe}):
        - Total Days: ${total}
        - Present: ${present} days (${percentage}%)
        - Absent: ${absent} days (${Math.round((absent/total)*100)}%)
        - Late: ${late} days (${Math.round((late/total)*100)}%)
        - Overall Attendance Rate: ${percentage}%`;

        // Add comparison data if available
        const previousPeriod = new Date(startDate);
        previousPeriod.setDate(previousPeriod.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let previousQuery = supabase
          .from('attendance')
          .select('status')
          .gte('date', previousPeriod.toISOString().split('T')[0])
          .lte('date', startDateStr);

        if (userRole === 'student') {
          previousQuery = previousQuery.eq('student_id', profile.id);
        }

        const { data: previousAttendance } = await previousQuery;
        
        if (previousAttendance && previousAttendance.length > 0) {
          const prevTotal = previousAttendance.length;
          const prevPresent = previousAttendance.filter(a => a.status === 'present').length;
          const prevPercentage = Math.round((prevPresent / prevTotal) * 100);
          const change = percentage - prevPercentage;
          
          analysisData += `\n\nComparison with previous period:
          - Previous attendance: ${prevPercentage}%
          - Change: ${change > 0 ? '+' : ''}${change}%`;
        }
      }
    }

    // Generate AI insights
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an educational data analyst providing insights for a ${userRole}. 
            Analyze the provided data and give meaningful, actionable insights in a friendly, encouraging tone.
            Focus on trends, improvements, areas of concern, and practical recommendations.
            Keep the response concise but informative.`
          },
          {
            role: 'user',
            content: `Please analyze this educational data and provide insights:\n\n${analysisData}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const aiData = await response.json();
    const insights = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      insights,
      chartData,
      rawData: analysisData,
      timeframe,
      analysisType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analyzer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: "I'm sorry, I'm having trouble analyzing the data right now. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
}