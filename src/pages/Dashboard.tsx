
import { useAuth } from '@/contexts/AuthContext';
import { AdminPanel } from '@/components/Admin/AdminPanel';
import { CoordinatorView } from '@/components/Coordinator/CoordinatorView';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // FORCE ADMIN PANEL for 'admin' role (which includes 'chiaraefer' prototype login)
    // If we wanted to strictly separate views we could check logic here,
    // but User requested 'single shared space (admin)' for now.
    // Existing Index check was: role === 'admin' ? AdminPanel : CoordinatorView

    if (role === 'admin') {
        return <AdminPanel />;
    }

    // Fallback for role='coordinator' (guest mode)
    return <CoordinatorView />;
};

export default Dashboard;
