import React, { useState } from 'react';
import AIChatbot from './AIChatbot';
import './ChatbotToggle.css';

const ChatbotToggle = ({ userId = null }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    const toggleChatbot = () => {
        setIsChatbotOpen(!isChatbotOpen);
    };

    const closeChatbot = () => {
        setIsChatbotOpen(false);
    };

    return (
        <>
            {/* Floating Chatbot Button */}
            <button
                className="chatbot-toggle-btn"
                onClick={toggleChatbot}
                title="Chat với AI Trợ lý"
                aria-label="Mở chatbot AI"
            >
                <span className="chatbot-icon">🤖</span>
                <span className="chatbot-label">AI Trợ lý</span>
                
                {/* Notification Badge */}
                <div className="chatbot-notification">
                    <span className="notification-dot"></span>
                </div>
            </button>

            {/* AI Chatbot Modal */}
            <AIChatbot
                isOpen={isChatbotOpen}
                onClose={closeChatbot}
                userId={userId}
            />
        </>
    );
};

export default ChatbotToggle;
