import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/Auth/LoginScreen';
import { AdminPanel } from '@/components/Admin/AdminPanel';
import { CoordinatorView } from '@/components/Coordinator/CoordinatorView';

const Index = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (role === 'admin') {
    return <AdminPanel />;
  }

  return <CoordinatorView />;
};

export default Index;
