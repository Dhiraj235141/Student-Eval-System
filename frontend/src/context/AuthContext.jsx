// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export const BACKEND_URL = `http://${window.location.hostname}:5000`;
// axios.defaults.baseURL = `${BACKEND_URL}/api`;

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       axios.get('/auth/me')
//         .then(res => setUser(res.data.user))
//         .catch(() => localStorage.removeItem('token'))
//         .finally(() => setLoading(false));
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const login = async (email, password) => {
//     const res = await axios.post('/auth/login', { email, password });
//     const { token, user } = res.data;
//     localStorage.setItem('token', token);
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     setUser(user);
//     return user;
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     delete axios.defaults.headers.common['Authorization'];
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading, updateUser: setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);







// test 2 
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

/*
  Backend URL Configuration
  - In production (Render), this will use:
      REACT_APP_API_URL=https://student-eval-system-2.onrender.com
  - In local development, it falls back to:
      http://localhost:5000
*/
export const BACKEND_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Set global Axios configuration
axios.defaults.baseURL = `${BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Attach token to all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch current user data
      axios
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
        })
        .catch((error) => {
          console.error('Authentication check failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      // Save token in local storage
      localStorage.setItem('token', token);

      // Set token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update user state
      setUser(user);

      return user;
    } catch (error) {
      console.error(
        'Login failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateUser: setUser,
        BACKEND_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => useContext(AuthContext);