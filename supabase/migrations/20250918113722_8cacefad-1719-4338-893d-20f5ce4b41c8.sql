-- Insert sample data for testing
-- First, insert a sample school
INSERT INTO public.schools (id, name, address, latitude, longitude) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Greenwood High School', '123 Education Street, Learning City, LC 12345', 40.7128, -74.0060);

-- Insert sample subjects
INSERT INTO public.subjects (id, name, code, description) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Mathematics', 'MATH101', 'Basic Mathematics and Algebra'),
('550e8400-e29b-41d4-a716-446655440011', 'English', 'ENG101', 'English Language and Literature'),
('550e8400-e29b-41d4-a716-446655440012', 'Science', 'SCI101', 'General Science and Physics'),
('550e8400-e29b-41d4-a716-446655440013', 'History', 'HIST101', 'World History and Geography'),
('550e8400-e29b-41d4-a716-446655440014', 'Computer Science', 'CS101', 'Introduction to Programming');

-- Insert sample classes  
INSERT INTO public.classes (id, name, grade, section, school_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Grade 10A', '10', 'A', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440021', 'Grade 10B', '10', 'B', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440022', 'Grade 9A', '9', 'A', '550e8400-e29b-41d4-a716-446655440001');