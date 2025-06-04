import { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);

    const resetSearch = () => {
        setSearchText('');
        setPage(1);
    };

    return (
        <SearchContext.Provider value={{ searchText, setSearchText, page, setPage, resetSearch }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearchContext = () => useContext(SearchContext);
