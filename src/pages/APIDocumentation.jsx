import React, { useState, useEffect } from 'react';
import { BookOpen, Code, Copy, Check, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export default function APIDocumentation() {
    const [docs, setDocs] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState({});

    const categories = ['all', 'webhooks', 'rest-api', 'sdks', 'integrations', 'guides'];

    useEffect(() => {
        loadDocumentation();
    }, []);

    useEffect(() => {
        filterDocs();
    }, [searchTerm, selectedCategory, docs]);

    const loadDocumentation = async () => {
        try {
            const data = await base44.entities.APIDocumentation.filter(
                { status: 'published' },
                '-created_date',
                100
            );
            setDocs(data || []);
            if (data && data.length > 0) {
                setSelectedDoc(data[0]);
            }
        } catch (error) {
            console.error('Load documentation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterDocs = () => {
        let filtered = docs;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(d => d.category === selectedCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(d =>
                d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredDocs(filtered);
    };

    const handleCopyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopied({ ...copied, [id]: true });
        setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
    };

    if (loading) {
        return <div className="p-8 text-center">Wird geladen...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">API Dokumentation</h1>
                    <p className="text-gray-600">Erfahre wie du die APIs und Webhooks nutzt</p>
                </div>

                <div className="grid grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="col-span-1">
                        <Card className="p-4 sticky top-8">
                            {/* Search */}
                            <div className="mb-4 relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Suchen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Categories */}
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`block w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${
                                            selectedCategory === cat
                                                ? 'bg-blue-100 text-blue-900'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {cat === 'all' ? 'Alle' : cat.replace('-', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Docs List */}
                            <div className="mt-6 space-y-1">
                                <p className="text-xs font-bold text-gray-500 uppercase px-4 mb-3">Dokumente</p>
                                {filteredDocs.map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className={`block w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                                            selectedDoc?.id === doc.id
                                                ? 'bg-blue-100 text-blue-900'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {doc.title}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="col-span-3">
                        {selectedDoc ? (
                            <div className="space-y-8">
                                {/* Title & Meta */}
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                        {selectedDoc.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                                            {selectedDoc.category}
                                        </span>
                                        {selectedDoc.method && (
                                            <span className="px-3 py-1 bg-gray-200 rounded font-mono">
                                                {selectedDoc.method}
                                            </span>
                                        )}
                                        {selectedDoc.api_endpoint && (
                                            <code className="text-gray-500">{selectedDoc.api_endpoint}</code>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <Card className="p-6">
                                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                                </Card>

                                {/* Parameters */}
                                {selectedDoc.parameters && selectedDoc.parameters.length > 0 && (
                                    <Card className="p-6">
                                        <h3 className="text-lg font-bold mb-4">Parameter</h3>
                                        <div className="space-y-4">
                                            {selectedDoc.parameters.map((param, idx) => (
                                                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-sm font-mono">{param.name}</code>
                                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                                            {param.type}
                                                        </span>
                                                        {param.required && (
                                                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                                                Erforderlich
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{param.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Code Examples */}
                                {selectedDoc.code_examples && selectedDoc.code_examples.length > 0 && (
                                    <div className="space-y-4">
                                        {selectedDoc.code_examples.map((example, idx) => (
                                            <Card key={idx} className="p-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-bold">{example.title}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyCode(example.code, `code-${idx}`)}
                                                        className="gap-2"
                                                    >
                                                        {copied[`code-${idx}`] ? (
                                                            <>
                                                                <Check className="w-4 h-4" />
                                                                Kopiert
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-4 h-4" />
                                                                Kopieren
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                                                    <code className={`language-${example.language}`}>
                                                        {example.code}
                                                    </code>
                                                </pre>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Card className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-2">Keine Dokumentation gefunden</h3>
                                <p className="text-gray-600">Wähle ein Dokument aus der Liste aus</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}