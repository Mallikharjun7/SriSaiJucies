import { toast } from 'react-toastify';

export const checkSessionExpiration = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!token || !isLoggedIn) {
    clearSession();
    toast.error('Your session has expired. Please login again.', {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    return true;
  }
  return false;
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userId');
};

export const setupAxiosInterceptors = (api, navigate) => {
  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      if (checkSessionExpiration()) {
        navigate('/login');
        return Promise.reject('Session expired');
      }
      const token = localStorage.getItem('token');
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearSession();
        toast.error('Your session has expired. Please login again.', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/login');
      }
      return Promise.reject(error);
    }
  );
}; 