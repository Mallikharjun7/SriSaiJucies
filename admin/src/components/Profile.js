import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                        Admin Dashboard
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm font-medium text-gray-500">Phone Number</p>
                            <p className="mt-1 text-lg text-gray-900">{admin?.phoneNumber}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm font-medium text-gray-500">Role</p>
                            <p className="mt-1 text-lg text-gray-900">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile; 