import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({
        title,
        message = '',
        type = 'info',
        duration = 4000,
        id = Date.now()
    }) => {
        const newToast = { id, title, message, type, duration };
        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Helper methods for common toast types
    const notify = {
        success: (title, message = '') => addToast({ title, message, type: 'success', duration: 3000 }),
        error: (title, message = '') => addToast({ title, message, type: 'error', duration: 5000 }),
        info: (title, message = '') => addToast({ title, message, type: 'info', duration: 4000 }),
        notification: (title, message = '', notificationType = 'new_message') =>
            addToast({ title, message, type: notificationType, duration: 4000 }),
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, notify }}>
            {children}
        </ToastContext.Provider>
    );
};
