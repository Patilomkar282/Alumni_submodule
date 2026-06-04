import React, { useState, useRef } from 'react';
import { Upload, Users, CheckCircle2, AlertCircle, X, Download, FileSpreadsheet, GraduationCap, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkImport() {
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'alumni'
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    // Clean up strings by removing quotes and trimming
    const cleanString = (str) => {
        if (!str) return '';
        return str.replace(/^["'](.+(?=["']$))["']$/, '$1').trim();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFile(null);
        setParsedData([]);
        setResult(null);
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        
        processFile(uploadedFile);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input
        }
    };

    const processFile = (uploadedFile) => {
        setFile(uploadedFile);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target.result;
            const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
            
            if (lines.length < 2) {
                alert("File appears empty or missing headers.");
                return;
            }

            // Parse headers
            const headers = lines[0].split(',').map(h => cleanString(h).toLowerCase());
            
            if (!headers.includes('email')) {
                alert(`Missing required column: email. Please ensure your CSV has an 'email' column.`);
                return;
            }

            const data = [];
            for (let i = 1; i < lines.length; i++) {
                // Split by comma but handle commas inside quotes
                const values = lines[i].match(/(?!\s*$)\s*(?:'([^'\\]*(?:\\[\s\S][^'\\]*)*)'|"([^"\\]*(?:\\[\s\S][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g);
                
                if (!values) continue;
                
                const rowObj = { role: activeTab }; // Force the role based on the active tab
                headers.forEach((header, index) => {
                    if (header === 'role') return; // Ignore role from CSV if present
                    let val = values[index] ? values[index].replace(/,$/, '').trim() : '';
                    rowObj[header] = cleanString(val);
                });

                if (rowObj.email) {
                    data.push(rowObj);
                }
            }

            setParsedData(data);
            setResult(null); // Clear previous results
        };
        reader.readAsText(uploadedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
            processFile(droppedFile);
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) return;
        
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/bulk-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(parsedData)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setResult(data);
                if (data.summary?.errorCount === 0) {
                    setParsedData([]); // Clear on perfect success
                    setFile(null);
                }
            } else {
                alert(data.message || 'Import failed');
            }
        } catch (error) {
            console.error("Import Error", error);
            alert("An error occurred during import.");
        } finally {
            setLoading(false);
        }
    };

    const downloadExportCSV = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                let users = await res.json();
                
                // Filter users based on active tab
                users = users.filter(u => u.role === activeTab);
                
                // Build CSV
                let csvContent = "data:text/csv;charset=utf-8,";
                
                if (activeTab === 'student') {
                    csvContent += "name,email,college,branch,graduationYear\r\n";
                    users.forEach(user => {
                        const row = [
                            `"${user.name || ''}"`,
                            `"${user.email || ''}"`,
                            `"${user.college || ''}"`,
                            `"${user.branch || ''}"`,
                            `"${user.graduationYear || user.currentYear || ''}"`
                        ].join(',');
                        csvContent += row + "\r\n";
                    });
                } else {
                    csvContent += "name,email,company,branch,graduationYear\r\n";
                    users.forEach(user => {
                        const row = [
                            `"${user.name || ''}"`,
                            `"${user.email || ''}"`,
                            `"${user.company || ''}"`,
                            `"${user.branch || ''}"`,
                            `"${user.graduationYear || ''}"`
                        ].join(',');
                        csvContent += row + "\r\n";
                    });
                }

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `mmcoe_${activeTab}s_export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Failed to export users.");
            }
        } catch (error) {
            console.error("Export Error", error);
            alert("Error exporting users.");
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="w-10 h-10 text-indigo-600" />
                        Bulk Import Users
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Manage student and alumni accounts via CSV import/export.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <button
                        onClick={() => handleTabChange('student')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'student' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Students
                    </button>
                    <button
                        onClick={() => handleTabChange('alumni')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'alumni' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <Briefcase className="w-5 h-5" />
                        Alumni
                    </button>
                </div>

                <div className="flex flex-col gap-8">
                    
                    {/* Top Section: Export & Upload */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Left Card: Export */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <FileSpreadsheet className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Export Current {activeTab === 'student' ? 'Students' : 'Alumni'}</h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-sm">
                                Download a CSV of all current {activeTab}s. You can add new rows to this file and re-upload it to bulk import new {activeTab}s.
                            </p>
                            <button 
                                onClick={downloadExportCSV}
                                className="text-indigo-600 text-sm font-bold flex items-center justify-center gap-2 w-full max-w-md bg-indigo-50 py-3.5 rounded-xl hover:bg-indigo-100 transition-colors"
                            >
                                <Download className="w-5 h-5" /> Export {activeTab === 'student' ? 'Students' : 'Alumni'}
                            </button>
                        </div>

                        {/* Right Card: Upload */}
                        <div className="flex flex-col gap-4">
                            <div 
                                className={`bg-white p-8 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer flex-1 flex flex-col justify-center ${
                                    isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="font-black text-slate-900 text-lg mb-1">Click or drag {activeTab === 'student' ? 'Students' : 'Alumni'} CSV</h3>
                                <p className="text-xs font-bold text-slate-400 mb-4">Maximum file size: 5MB</p>
                                
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                />

                                {file && (
                                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 text-left max-w-md mx-auto w-full">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-bold text-emerald-900 truncate">{file.name}</p>
                                            <p className="text-xs text-emerald-600 font-medium">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} records found</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFile(null); setParsedData([]); setResult(null); }}
                                            className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {parsedData.length > 0 && (
                                <button 
                                    onClick={handleImport}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Importing {activeTab === 'student' ? 'Students' : 'Alumni'}...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Import {parsedData.length} {activeTab === 'student' ? 'Students' : 'Alumni'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Section: Full Width Data View */}
                    <div className="w-full">
                        {/* Results Summary Box */}
                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-6"
                                >
                                    <h3 className="font-black text-slate-900 text-xl mb-6">Import Results ({activeTab === 'student' ? 'Students' : 'Alumni'})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="bg-emerald-50 p-6 rounded-2xl">
                                            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Success</p>
                                            <p className="text-4xl font-black text-emerald-700">{result.summary.successCount}</p>
                                        </div>
                                        <div className="bg-amber-50 p-6 rounded-2xl">
                                            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Skipped (Exists)</p>
                                            <p className="text-4xl font-black text-amber-700">{result.summary.skipCount}</p>
                                        </div>
                                        <div className="bg-red-50 p-6 rounded-2xl">
                                            <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Errors</p>
                                            <p className="text-4xl font-black text-red-700">{result.summary.errorCount}</p>
                                        </div>
                                    </div>
                                    
                                    {result.errors?.length > 0 && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                                            <h4 className="text-md font-bold text-red-800 mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" /> Error Log
                                            </h4>
                                            <ul className="text-sm text-red-600 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                {result.errors.map((err, i) => (
                                                    <li key={i} className="flex justify-between border-b border-red-100/50 pb-2">
                                                        <span className="font-medium truncate mr-4">{err.email || err.name}</span>
                                                        <span>{err.error}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Data Preview Table */}
                        {parsedData.length > 0 && !result && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-black text-slate-900 text-lg">Data Preview</h3>
                                    <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full">
                                        Showing top 100 rows
                                    </span>
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white sticky top-0 shadow-sm z-10">
                                            <tr>
                                                <th className="p-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Name</th>
                                                <th className="p-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Email</th>
                                                <th className="p-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedData.slice(0, 100).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 px-6 font-bold text-slate-900 text-sm">{row.name || '—'}</td>
                                                    <td className="p-4 px-6 font-medium text-slate-600 text-sm">{row.email}</td>
                                                    <td className="p-4 px-6 text-xs font-medium text-slate-500">
                                                        {activeTab === 'alumni' 
                                                            ? (row.company || row.graduationYear ? `${row.company || ''} ${row.graduationYear ? `(${row.graduationYear})` : ''}` : '—')
                                                            : (row.college || row.branch ? `${row.college || ''} ${row.branch ? `(${row.branch})` : ''}` : '—')
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {parsedData.length === 0 && !result && (
                            <div className="bg-slate-100/50 rounded-3xl border border-slate-200 border-dashed py-24 flex flex-col items-center justify-center text-center px-8">
                                <Users className="w-16 h-16 text-slate-300 mb-6" />
                                <h3 className="font-black text-slate-400 text-2xl mb-3">No {activeTab === 'student' ? 'Students' : 'Alumni'} Data</h3>
                                <p className="text-slate-400 font-medium text-lg max-w-md">Upload a CSV file above to preview the {activeTab} records here.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
