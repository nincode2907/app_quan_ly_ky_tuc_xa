import { createContext, useContext, useState } from 'react';

const LikedRoomsContext = createContext();

export const LikedRoomsProvider = ({ children }) => {
    const [likedRooms, setLikedRooms] = useState({});

    const toggleLike = (room) => {
        setLikedRooms((prev) => {
            const updated = { ...prev };
            if (updated[room.id]) {
                delete updated[room.id]; // Bỏ thích
            } else {
                updated[room.id] = room; // Thêm thích
            }
            return updated;
        });
    };

    return (
        <LikedRoomsContext.Provider value={{ likedRooms, toggleLike }}>
            {children}
        </LikedRoomsContext.Provider>
    );
};

export const useLikedRooms = () => useContext(LikedRoomsContext);
