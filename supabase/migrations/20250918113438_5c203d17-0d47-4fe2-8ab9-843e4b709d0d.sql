-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_classes junction table
CREATE TABLE public.student_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(student_id, class_id)
);

-- Create parent_students junction table
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  UNIQUE(parent_id, student_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIME,
  location_verified BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create curriculum table
CREATE TABLE public.curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_url TEXT,
  file_path TEXT,
  assignment_date DATE,
  due_date DATE,
  type TEXT CHECK (type IN ('lesson', 'assignment', 'activity', 'exam')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'assignment', 'general', 'emergency')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  badge_type TEXT NOT NULL,
  earned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leave_applications table
CREATE TABLE public.leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  parent_approved BOOLEAN DEFAULT false,
  teacher_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Students can see their classmates and teachers
CREATE POLICY "Students can view classmates and teachers" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_classes sc1
    JOIN public.student_classes sc2 ON sc1.class_id = sc2.class_id
    WHERE sc1.student_id = auth.uid() AND sc2.student_id = profiles.user_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.student_classes sc ON c.id = sc.class_id
    WHERE sc.student_id = auth.uid() AND c.teacher_id = profiles.id
  )
);

-- Teachers can view their students
CREATE POLICY "Teachers can view their students" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.student_classes sc ON c.id = sc.class_id
    WHERE c.teacher_id = auth.uid() AND sc.student_id = profiles.user_id
  )
);

-- Parents can view their children
CREATE POLICY "Parents can view their children" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = profiles.user_id
  )
);

-- Attendance policies
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view class attendance" ON public.attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can manage class attendance" ON public.attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Parents can view child attendance" ON public.attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance.student_id
  )
);

-- Curriculum policies
CREATE POLICY "Students can view class curriculum" ON public.curriculum FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_classes sc
    WHERE sc.student_id = auth.uid() AND sc.class_id = curriculum.class_id
  )
);
CREATE POLICY "Teachers can manage curriculum" ON public.curriculum FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Parents can view child's curriculum" ON public.curriculum FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.student_classes sc ON ps.student_id = sc.student_id
    WHERE ps.parent_id = auth.uid() AND sc.class_id = curriculum.class_id
  )
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());

-- Other table policies (basic access patterns)
CREATE POLICY "All authenticated users can view schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view relevant student_classes" ON public.student_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view relevant parent_students" ON public.parent_students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can view own achievements" ON public.achievements FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can manage own leave applications" ON public.leave_applications FOR ALL USING (student_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();