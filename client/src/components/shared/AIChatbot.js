import React, { useState, useEffect, useRef } from 'react';
import api from '../../configs/Apis';
import './AIChatbot.css';

const AIChatbot = ({ isOpen, onClose, userId = null }) => {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Khởi tạo chat session khi mở chatbot
    useEffect(() => {
        if (isOpen && !sessionId) {
            startNewChat();
        }
    }, [isOpen]);

    // Focus input khi mở chatbot
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    const startNewChat = async () => {
        try {
            setIsLoading(true);
            const response = await api.post(`/chatbot/start`, {
                userId: userId
            });

            if (response.data.success) {
                setSessionId(response.data.sessionId);
                setMessages([response.data.initialMessage]);
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            setMessages([{
                role: 'system',
                content: 'Xin lỗi, có lỗi xảy ra khi khởi tạo chat. Vui lòng thử lại.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim() || !sessionId || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        // Thêm tin nhắn của user vào chat
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const response = await api.post(`/chatbot/message`, {
                sessionId: sessionId,
                message: userMessage.content,
                userId: userId
            });

            if (response.data.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.data.response,
                    timestamp: new Date(),
                    metadata: {
                        intent: response.data.intent,
                        confidence: response.data.confidence,
                        entities: response.data.entities
                    }
                };

                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            sendMessage(e);
        }
    };

    const formatMessage = (message) => {
        // Xử lý xuống dòng trong tin nhắn
        return message.content.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < message.content.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    const getMessageTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIntentIcon = (intent) => {
        const intentIcons = {
            'product_search': '🔍',
            'category_info': '📂',
            'price_inquiry': '💰',
            'stock_check': '📦',
            'product_comparison': '⚖️',
            'recommendation': '💡',
            'greeting': '👋',
            'farewell': '👋',
            'general_question': '❓'
        };
        return intentIcons[intent] || '💬';
    };

    if (!isOpen) return null;

    return (
        <div className="ai-chatbot-overlay" onClick={onClose}>
            <div className="ai-chatbot-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="ai-chatbot-header">
                    <div className="ai-chatbot-title">
                        <span className="ai-icon">🤖</span>
                        <span>AI Trợ lý</span>
                    </div>
                    <button className="ai-chatbot-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Messages Container */}
                <div className="ai-chatbot-messages">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`ai-message ${message.role === 'user' ? 'user' : 'assistant'}`}
                        >
                            <div className="ai-message-content">
                                {message.role === 'assistant' && message.metadata?.intent && (
                                    <div className="ai-message-intent">
                                        {getIntentIcon(message.metadata.intent)}
                                        <span className="intent-text">
                                            {message.metadata.intent.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}
                                <div className="ai-message-text">
                                    {formatMessage(message)}
                                </div>
                                <div className="ai-message-time">
                                    {getMessageTime(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="ai-message assistant">
                            <div className="ai-message-content">
                                <div className="ai-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form className="ai-chatbot-input-form" onSubmit={sendMessage}>
                    <div className="ai-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập câu hỏi của bạn..."
                            disabled={isLoading || !sessionId}
                            className="ai-message-input"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !sessionId || !inputMessage.trim()}
                            className="ai-send-button"
                        >
                            {isLoading ? '⏳' : '📤'}
                        </button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="ai-quick-actions">
                        <button
                            type="button"
                            onClick={() => setInputMessage('Tìm sản phẩm')}
                            className="ai-quick-action-btn"
                        >
                            🔍 Tìm sản phẩm
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMessage('Xem danh mục')}
                            className="ai-quick-action-btn"
                        >
                            📂 Danh mục
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMessage('Đề xuất sản phẩm')}
                            className="ai-quick-action-btn"
                        >
                            💡 Đề xuất
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="ai-chatbot-footer">
                    <small>AI được huấn luyện với dữ liệu sản phẩm thực tế</small>
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;
