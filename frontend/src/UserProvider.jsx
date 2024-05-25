import React, { createContext, useState, useEffect, useContext } from "react";
import apiRequest from "./apiRequest.jsx";

// Create a UserContext with default value of null
const UserContext = createContext(null);

// Create a UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let userData = JSON.parse(localStorage.getItem("userData"));
        const jwt = localStorage.getItem("access");

        if (!userData && jwt) {
          userData = await apiRequest("me/", "GET");
          localStorage.setItem("userData", JSON.stringify(userData));
        }

        setUser(userData);
      } catch (error) {
        console.error(error);
      }
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook that shortcut the context!
export const useUser = () => useContext(UserContext);
