import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Brain, QrCode, Bell, BarChart3, MessageCircle, Shield, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface LandingPageProps {
  onRoleSelect: (role: 'student' | 'teacher' | 'parent' | 'admin') => void;
}

const LandingPage = ({ onRoleSelect }: LandingPageProps) => {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      icon: GraduationCap,
      description: 'Access curriculum, view attendance, earn badges',
      features: ['View Attendance', 'Download Materials', 'AI Insights', 'Chatbot Support'],
      color: 'gradient-primary'
    },
    {
      id: 'teacher' as const,
      title: 'Teacher',
      icon: BookOpen,
      description: 'Manage classes, mark attendance, upload curriculum',
      features: ['QR Attendance', 'Upload Lessons', 'Class Analytics', 'Parent Notifications'],
      color: 'gradient-success'
    },
    {
      id: 'parent' as const,
      title: 'Parent',
      icon: Users,
      description: 'Monitor child progress, receive notifications',
      features: ['Real-time Alerts', 'Progress Reports', 'AI Insights', 'Leave Applications'],
      color: 'gradient-warm'
    },
    {
      id: 'admin' as const,
      title: 'Admin',
      icon: Shield,
      description: 'Institution management and analytics',
      features: ['User Management', 'Institution Analytics', 'Reports Export', 'System Settings'],
      color: 'bg-gradient-to-br from-purple-500 to-purple-700'
    }
  ];

  const features = [
    { icon: QrCode, title: 'QR Code Attendance', description: 'Quick and contactless attendance marking' },
    { icon: Bell, title: 'Instant Notifications', description: 'Real-time alerts for parents and students' },
    { icon: Brain, title: 'AI Analytics', description: 'Smart insights and trend analysis' },
    { icon: MapPin, title: 'Geo-fencing', description: 'Location-based attendance validation' },
    { icon: BarChart3, title: 'Rich Reports', description: 'Comprehensive analytics and exports' },
    { icon: MessageCircle, title: '24/7 Chatbot', description: 'Always available AI assistant' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Smart Education Technology
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            Smart Curriculum
            <br />Activity & Attendance
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform education with AI-powered attendance tracking, curriculum management, 
            and intelligent analytics for modern institutions.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border">
              <QrCode className="w-4 h-4 text-primary" />
              QR Code Attendance
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border">
              <Brain className="w-4 h-4 text-secondary" />
              AI Analytics
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border">
              <Bell className="w-4 h-4 text-accent" />
              Instant Notifications
            </div>
          </div>
        </motion.div>

        {/* Role Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Role</h2>
          <p className="text-center text-muted-foreground mb-12">
            Select your role to access personalized dashboard and features
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHoveredRole(role.id)}
                onHoverEnd={() => setHoveredRole(null)}
              >
                <Card className="p-6 h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/20">
                  <div className={`w-16 h-16 rounded-2xl ${role.color} flex items-center justify-center mb-4 mx-auto`}>
                    <role.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-2">{role.title}</h3>
                  <p className="text-muted-foreground text-center text-sm mb-4">{role.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => onRoleSelect(role.id)}
                    className="w-full"
                    variant={hoveredRole === role.id ? "default" : "outline"}
                  >
                    Continue as {role.title}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need for modern educational management
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="p-6 h-full text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;