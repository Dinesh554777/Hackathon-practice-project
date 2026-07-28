import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Role</label>
            <p className="font-medium capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
