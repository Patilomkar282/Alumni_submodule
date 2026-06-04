import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';

export default function InviteMemberModal({ isOpen, onClose, onInviteMember, currentMembers = [] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [availableConnections, setAvailableConnections] = useState([]);

    // Fetch connections when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchConnections();
            setSelectedMembers([]);
            setSearchQuery("");
        }
    }, [isOpen]);

    const fetchConnections = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Filter out already existing members
                // currentMembers is array of user objects or IDs? Usually objects if populated.
                // Safely handle both
                const memberIds = currentMembers.map(m => m._id || m);
                const filteredData = data.filter(conn => !memberIds.includes(conn._id));
                setAvailableConnections(filteredData);
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const handleToggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onInviteMember(selectedMembers);
        onClose();
    };

    if (!isOpen) return null;

    const filteredConnections = availableConnections.filter(conn =>
        conn.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Invite Members</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search connections..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredConnections.length > 0 ? (
                                    filteredConnections.map(conn => (
                                        <div
                                            key={conn._id}
                                            onClick={() => handleToggleMember(conn._id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(conn._id)
                                                    ? 'bg-indigo-50 border border-indigo-200'
                                                    : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                        >
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {conn.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{conn.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{conn.company || conn.branch}</p>
                                            </div>
                                            {selectedMembers.includes(conn._id) && (
                                                <div className="bg-indigo-600 text-white p-1 rounded-full">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 text-sm py-4">No connections available to invite.</p>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="invite-member-form"
                        disabled={selectedMembers.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Selected
                    </button>
                </div>
            </div>
        </div>
    );
}
