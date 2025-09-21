import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/components/LandingPage";
import AuthForm from "@/components/AuthForm";
import Navigation from "@/components/Navigation";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import AttendanceSystem from "@/components/AttendanceSystem";
import AIAnalyzer from "@/components/AIAnalyzer";

type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

const AppRouter = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setSelectedRole(null);
  };

  const handleBack = () => {
    setShowAuth(false);
    setSelectedRole(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    if (showAuth && selectedRole) {
      return (
        <AuthForm
          selectedRole={selectedRole}
          onSuccess={handleAuthSuccess}
          onBack={handleBack}
        />
      );
    }
    return <LandingPage onRoleSelect={handleRoleSelect} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        switch (profile?.role) {
          case 'student':
            return <StudentDashboard />;
          case 'teacher':
            return <TeacherDashboard />;
          case 'parent':
            return <ParentDashboard />;
          case 'admin':
            return <AdminDashboard />;
          default:
            return <StudentDashboard />;
        }
      case 'attendance':
        return <AttendanceSystem />;
      case 'ai-analyzer':
        return <AIAnalyzer />;
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h2>
            <p className="text-muted-foreground">Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        userRole={profile.role as UserRole}
        userName={`${profile.first_name} ${profile.last_name}`}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default AppRouter;