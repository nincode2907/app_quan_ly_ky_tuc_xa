import { createContext, useContext, useState, useEffect } from 'react';
import { toggleFavoriteRoom, getFavoriteRooms } from '../configs/RoomApi';

const LikedRoomsContext = createContext();

export const LikedRoomsProvider = ({ children, token }) => {
    const [likedRooms, setLikedRooms] = useState({});

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const favorites = await getFavoriteRooms(token);
                const map = {};
                favorites.forEach((room) => {
                    map[room.id] = room;
                });
                setLikedRooms(map);
            } catch (err) {
                console.error('Failed to fetch favorite rooms', err);
            }
        };
        if (token) fetchFavorites();
    }, [token]);

    const toggleLike = async (room) => {
        try {
            const result = await toggleFavoriteRoom(room.id, token);
            setLikedRooms((prev) => {
                const updated = { ...prev };
                if (result.is_favorite) {
                    updated[room.id] = room;
                } else {
                    delete updated[room.id];
                }
                return updated;
            });
        } catch (err) {
            console.error('Failed to toggle like', err);
        }
    };

    return (
        <LikedRoomsContext.Provider value={{ likedRooms, toggleLike }}>
            {children}
        </LikedRoomsContext.Provider>
    );
};

export const useLikedRooms = () => useContext(LikedRoomsContext);
