import React, { createContext, useContext, useState } from 'react';

const ChatModalContext = createContext();

export const useChatModal = () => useContext(ChatModalContext);

export const ChatModalProvider = ({ children }) => {
  const [isChatModalVisible, setChatModalVisible] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);

  const openChatModal = (id) => {
    setTournamentId(id);
    setChatModalVisible(true);
  };

  const closeChatModal = () => {
    setChatModalVisible(false);
    setTournamentId(null);
  };

  return (
    <ChatModalContext.Provider value={{ isChatModalVisible, tournamentId, openChatModal, closeChatModal }}>
      {children}
    </ChatModalContext.Provider>
  );
};
