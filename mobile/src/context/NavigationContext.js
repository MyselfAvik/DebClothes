import React, { createContext, useState, useContext } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('HOME'); // Default screen is HOME (redirected to LOGIN if needed)
  const [screenParams, setScreenParams] = useState({});
  const [history, setHistory] = useState([]);

  const navigateTo = (screen, params = {}) => {
    setHistory((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevStack) => prevStack.slice(0, -1));
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params || {});
    }
  };

  const resetTo = (screen, params = {}) => {
    setHistory([]);
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        screenParams,
        navigateTo,
        goBack,
        resetTo,
        canGoBack: history.length > 0,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => useContext(NavigationContext);
