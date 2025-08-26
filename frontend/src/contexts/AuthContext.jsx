import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "LOGOUT":
      localStorage.removeItem("token");
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier le token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await authAPI.getProfile();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.data,
              token,
            },
          });
        } catch (error) {
          localStorage.removeItem("token");
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuth();
  }, []);

  // Actions
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: response.data,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur de connexion";
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.register(userData);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: response.data,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur d'inscription";
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.isAdmin || false,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
