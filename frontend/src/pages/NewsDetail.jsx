import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ExternalLink } from 'lucide-react';
import Header from '../components/Header';

const NewsDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { article } = location.state || {};

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-24 px-4 max-w-4xl mx-auto text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Article not found</h2>
                    <button
                        onClick={() => navigate('/home')}
                        className="mt-4 text-indigo-600 hover:underline"
                    >
                        Go back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Feed
                </button>

                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {article.urlToImage && (
                        <div className="w-full h-64 sm:h-96 bg-gray-100">
                            <img
                                src={article.urlToImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6 sm:p-10">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
                            {article.author && (
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    {article.author}
                                </div>
                            )}
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(article.publishedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="flex items-center text-indigo-600 font-medium">
                                {article.source.name}
                            </div>
                        </div>

                        <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                            <p className="text-lg mb-6 font-medium text-gray-800">
                                {article.description}
                            </p>
                            <p className="whitespace-pre-wrap mb-6">
                                {article.content ? article.content.split('[')[0] : 'Read the full story by visiting the source link below.'}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Read Full Article at Source
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
};

export default NewsDetail;
