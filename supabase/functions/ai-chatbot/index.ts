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
    const { message, userId, userRole } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client for data queries
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get user context and relevant data
    let systemContext = `You are a helpful AI assistant for Smart Curriculum Activity & Attendance App. 
    The user is a ${userRole}. Be helpful, friendly, and provide relevant information about:
    - Attendance tracking and statistics
    - Curriculum and assignments
    - School activities and schedules
    - Academic progress and performance
    - General school information`;

    // Add role-specific context
    if (userRole === 'student') {
      systemContext += `
      For students, you can help with:
      - Checking attendance records
      - Viewing assignments and deadlines
      - Understanding academic progress
      - School schedule queries
      - General study tips and guidance`;
    } else if (userRole === 'teacher') {
      systemContext += `
      For teachers, you can help with:
      - Managing class attendance
      - Uploading and organizing curriculum
      - Tracking student progress
      - Creating assignments and activities
      - Generating reports`;
    } else if (userRole === 'parent') {
      systemContext += `
      For parents, you can help with:
      - Monitoring child's attendance
      - Viewing academic progress
      - Understanding school activities
      - Communication with teachers
      - School event information`;
    } else if (userRole === 'admin') {
      systemContext += `
      For administrators, you can help with:
      - Institution-wide analytics
      - Managing users and classes
      - System administration
      - Report generation
      - Policy and procedure questions`;
    }

    // Fetch relevant user data for context (if userId provided)
    let userDataContext = '';
    if (userId) {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('user_id', userId)
          .single();

        if (profile) {
          userDataContext += `User: ${profile.first_name} ${profile.last_name} (${profile.role})\n`;
        }

        // Get recent attendance if student or parent
        if (userRole === 'student') {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('date, status')
            .eq('student_id', profile?.id)
            .order('date', { ascending: false })
            .limit(5);

          if (attendance && attendance.length > 0) {
            userDataContext += `Recent attendance: ${attendance.map(a => `${a.date}: ${a.status}`).join(', ')}\n`;
          }
        }

        // Get recent notifications
        const { data: notifications } = await supabase
          .from('notifications')
          .select('title, message, created_at')
          .eq('recipient_id', profile?.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (notifications && notifications.length > 0) {
          userDataContext += `Recent notifications: ${notifications.map(n => n.title).join(', ')}\n`;
        }
      } catch (error) {
        console.log('Error fetching user context:', error);
      }
    }

    const fullSystemContext = systemContext + (userDataContext ? `\n\nUser Context:\n${userDataContext}` : '');

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
            content: fullSystemContext
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Log the conversation for analytics
    if (userId) {
      try {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: userId,
            title: 'Chatbot Interaction',
            message: `Asked: "${message.substring(0, 50)}..." | Response: "${botResponse.substring(0, 50)}..."`,
            type: 'general'
          });
      } catch (error) {
        console.log('Error logging conversation:', error);
      }
    }

    return new Response(JSON.stringify({ 
      response: botResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact support if the issue persists."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});