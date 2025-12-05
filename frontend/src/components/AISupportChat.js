import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './AISupportChat.css';

const AISupportChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'ai',
            text: 'Hello! 👋 I\'m your NeoFace AI Assistant. I\'m here 24/7 to help you with:\n\n• Creating, updating, or deleting records\n• Taking attendance\n• Generating timetables\n• Managing students, admins, subjects\n• Troubleshooting issues\n• Navigating the application\n\nHow can I assist you today?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const messagesEndRef = useRef(null);
    const chatIconRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle dragging
    const handleMouseDown = (e) => {
        if (isOpen) return; // Don't drag when chat is open
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 70;
        const maxY = window.innerHeight - 70;

        setPosition({
            x: Math.max(10, Math.min(newX, maxX)),
            y: Math.max(10, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    // AI Response Logic
    const getAIResponse = async (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();

        // Knowledge base for NeoFace application
        const responses = {
            // Greetings
            greeting: {
                keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
                response: 'Hello! How can I help you with NeoFace today? I can assist with creating records, taking attendance, managing timetables, and more!'
            },

            // Creating records
            createStudent: {
                keywords: ['create student', 'add student', 'new student', 'register student'],
                response: `To create a new student:\n\n1. Go to the "Students" tab in the navigation menu\n2. Click the "+ Add Student" button\n3. Fill in the required fields:\n   • Name\n   • Email\n   • University ID\n   • Department (Branch code)\n   • Semester\n   • Year\n   • Section\n4. Click "Create Student"\n\n✅ The student will be automatically assigned a roll number and enrolled in matching subjects!`
            },

            createAdmin: {
                keywords: ['create admin', 'add admin', 'new admin', 'register admin'],
                response: `To create a new admin:\n\n1. Go to the "Admins" tab\n2. Fill in the "Create New Admin" form:\n   • Full Name\n   • Email\n   • Password (min 6 characters)\n   • Role: Select "admin"\n   • Department (optional)\n   • University (optional)\n   • Campus (optional)\n3. Click "Create Admin"\n\n✅ The admin will be created and can log in immediately!`
            },

            createUniversity: {
                keywords: ['create university', 'add university', 'new university'],
                response: `To create a new university:\n\n1. Go to the "Universities" tab\n2. Click "+ Add University" button\n3. Fill in the details:\n   • University Name\n   • Code (unique identifier)\n   • Established Year\n   • Accreditation\n   • Address (street, city, state, country, pincode)\n   • Contact Info (phone, email, website)\n4. Click "Create University"\n\n✅ Your university will be created successfully!`
            },

            // Attendance
            attendance: {
                keywords: ['attendance', 'mark attendance', 'take attendance', 'attendance marking'],
                response: `To mark attendance:\n\n1. Go to the "Mark Attendance" tab\n2. Select:\n   • Subject\n   • Date\n   • Time slot (if applicable)\n3. Choose marking method:\n   • **Face Recognition**: Use camera for automatic marking\n   • **Manual**: Select students and mark present/absent\n4. Click "Submit Attendance"\n\n✅ Attendance will be recorded with timestamp and confidence score (for face recognition)!`
            },

            // Timetable
            timetable: {
                keywords: ['timetable', 'schedule', 'generate timetable', 'create timetable'],
                response: `To generate a timetable:\n\n1. Go to the "Timetables" tab\n2. Click "Generate Timetable" button\n3. Configure:\n   • University, Campus, School, Program, Course, Branch\n   • Batch, Semester, Section\n   • Daily hours (start/end time)\n   • Off day\n   • Break times\n   • Rooms available\n   • Teacher availability (optional)\n4. Click "Generate"\n\n✅ The system will create a conflict-free timetable automatically!\n\n**Note**: The system checks for:\n• Time slot conflicts\n• Teacher conflicts\n• Room conflicts`
            },

            // Update records
            update: {
                keywords: ['update', 'edit', 'modify', 'change'],
                response: `To update any record:\n\n1. Navigate to the relevant tab (Students, Admins, Universities, etc.)\n2. Find the record you want to update\n3. Click the "Edit" or "✏️" button\n4. Modify the fields you want to change\n5. Click "Update" or "Save"\n\n✅ Changes will be saved immediately!\n\n**Note**: Some fields may be read-only for data integrity.`
            },

            // Delete records
            delete: {
                keywords: ['delete', 'remove', 'deactivate'],
                response: `To delete a record:\n\n1. Navigate to the relevant tab\n2. Find the record to delete\n3. Click the "Delete" or "🗑️" button\n4. Confirm the deletion\n\n**Important**:\n• Default deletion is "soft delete" (can be restored)\n• For permanent deletion, use the permanent delete option\n• Deleting cascades to related records (e.g., deleting a student removes their attendance)\n\n✅ Deleted records are marked as inactive!`
            },

            // Navigation
            navigation: {
                keywords: ['navigate', 'where is', 'how to find', 'go to', 'menu'],
                response: `NeoFace has 17 main sections:\n\n1. **Overview** - Dashboard with statistics\n2. **Universities** - Manage universities\n3. **Campus** - Manage campuses\n4. **Schools** - Manage schools\n5. **Programs** - Manage programs\n6. **Courses** - Manage courses\n7. **Branches** - Manage branches\n8. **Batches** - Manage batches\n9. **Admins** - Manage admin users\n10. **Students** - Manage students\n11. **Subjects** - Manage subjects\n12. **Semesters** - Manage semesters\n13. **Timetables** - View/generate timetables\n14. **Mark Attendance** - Take attendance\n15. **Analytics** - View reports and analytics\n16. **Admit Cards** - Generate admit cards\n17. **Override** - SuperAdmin overrides\n\nClick any tab in the navigation menu to access these sections!`
            },

            // Troubleshooting
            error: {
                keywords: ['error', 'not working', 'issue', 'problem', 'bug', 'fix'],
                response: `Common issues and solutions:\n\n**1. Button not working:**\n   • Refresh the page (F5)\n   • Clear browser cache\n   • Check if you're logged in\n\n**2. Can't create record:**\n   • Ensure all required fields are filled\n   • Check for duplicate emails/IDs\n   • Verify you have proper permissions\n\n**3. Attendance not saving:**\n   • Check if subject is selected\n   • Verify date is correct\n   • Ensure students are enrolled in the subject\n\n**4. Timetable generation fails:**\n   • Check teacher availability constraints\n   • Ensure enough rooms are available\n   • Verify subjects have assigned teachers\n\n**5. Login issues:**\n   • Verify email and password\n   • Check if account is active\n   • Contact SuperAdmin if locked out\n\nIf issues persist, please contact your system administrator!`
            },

            // Analytics
            analytics: {
                keywords: ['analytics', 'reports', 'statistics', 'dashboard', 'overview'],
                response: `To view analytics:\n\n1. **Overview Dashboard**:\n   • Go to "Overview" tab\n   • View key metrics (students, admins, subjects)\n   • See attendance visualizations\n   • Check 3D charts and heatmaps\n\n2. **Analytics Tab**:\n   • Go to "Analytics" tab\n   • View detailed reports\n   • Filter by date, subject, student\n   • Export data if needed\n\n**Available Metrics**:\n• Total students, admins, subjects\n• Attendance percentage\n• Subject-wise attendance\n• Daily trends\n• Student performance\n\n✅ All data updates in real-time!`
            },

            // Subjects
            subjects: {
                keywords: ['subject', 'subjects', 'create subject', 'add subject'],
                response: `To manage subjects:\n\n**Create Subject:**\n1. Go to "Subjects" tab\n2. Click "+ Add Subject"\n3. Fill in:\n   • Subject Code\n   • Subject Name\n   • Department (Branch)\n   • Semester\n   • Credits\n   • Type (theory/practical/lab)\n   • Faculty (assign teacher)\n4. Click "Create Subject"\n\n**Features**:\n• Auto-enrollment of students\n• Faculty assignment\n• Credit management\n• Section-wise subjects\n\n✅ Students in matching department/semester are automatically enrolled!`
            },

            // Face Recognition
            faceRecognition: {
                keywords: ['face recognition', 'face', 'camera', 'register face'],
                response: `Face Recognition for Attendance:\n\n**Setup:**\n1. Students must register their face first\n2. Go to student profile\n3. Click "Register Face"\n4. Allow camera access\n5. Look at camera and click capture\n\n**Taking Attendance:**\n1. Go to "Mark Attendance"\n2. Select subject and date\n3. Choose "Face Recognition" method\n4. Allow camera access\n5. Students look at camera one by one\n6. System automatically marks attendance\n\n**Features**:\n• Confidence score tracking\n• Timestamp recording\n• Automatic student identification\n• Works in real-time\n\n✅ Highly accurate and fast!`
            },

            // Help
            help: {
                keywords: ['help', 'support', 'assist', 'guide', 'tutorial'],
                response: `I'm here to help! Here are common topics:\n\n**Getting Started:**\n• Creating records (students, admins, etc.)\n• Navigating the application\n• Understanding the dashboard\n\n**Core Features:**\n• Taking attendance (manual & face recognition)\n• Generating timetables\n• Managing subjects and semesters\n• Viewing analytics\n\n**Administration:**\n• User management\n• Permissions and roles\n• Data import/export\n\n**Troubleshooting:**\n• Fixing errors\n• Performance issues\n• Login problems\n\nJust ask me anything specific, like:\n• "How do I create a student?"\n• "How to mark attendance?"\n• "How to generate timetable?"\n• "Where is the analytics section?"`
            }
        };

        // Find matching response
        for (const [key, data] of Object.entries(responses)) {
            if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
                return data.response;
            }
        }

        // Default response if no match
        return `I'm not sure about that specific question, but I can help you with:\n\n• **Creating** students, admins, universities, subjects, etc.\n• **Taking attendance** (manual or face recognition)\n• **Generating timetables** (conflict-free)\n• **Managing** all components of NeoFace\n• **Troubleshooting** common issues\n• **Navigating** the application\n\nCould you please rephrase your question or ask about one of these topics?\n\nFor example:\n• "How do I create a student?"\n• "How to mark attendance?"\n• "Where is the timetable section?"\n• "How to fix login issues?"`;
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        // Add user message
        const userMsg = {
            type: 'user',
            text: inputMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsTyping(true);

        // Simulate AI thinking time
        setTimeout(async () => {
            const aiResponse = await getAIResponse(inputMessage);

            const aiMsg = {
                type: 'ai',
                text: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickActions = [
        { label: '📚 Create Student', query: 'How do I create a student?' },
        { label: '✅ Mark Attendance', query: 'How to mark attendance?' },
        { label: '📅 Generate Timetable', query: 'How to generate timetable?' },
        { label: '📊 View Analytics', query: 'Where is analytics?' },
        { label: '👨‍🏫 Add Admin', query: 'How to create an admin?' },
        { label: '🎓 Create Subject', query: 'How to add a subject?' }
    ];

    const handleQuickAction = (query) => {
        setInputMessage(query);
        setTimeout(() => handleSendMessage(), 100);
    };

    return (
        <>
            {/* Draggable Chat Icon */}
            <motion.div
                ref={chatIconRef}
                className={`ai-chat-icon ${isOpen ? 'hidden' : ''}`}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: 9999
                }}
                onMouseDown={handleMouseDown}
                onClick={() => !isDragging && setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                drag={false}
            >
                <div className="ai-icon-wrapper">
                    <div className="ai-icon-pulse"></div>
                    <div className="ai-icon-content">
                        🤖
                    </div>
                    <div className="ai-icon-badge">24/7</div>
                </div>
                <div className="ai-icon-tooltip">AI Support - Drag me anywhere!</div>
            </motion.div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-chat-window"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header */}
                        <div className="ai-chat-header">
                            <div className="ai-chat-header-left">
                                <div className="ai-avatar">🤖</div>
                                <div className="ai-header-info">
                                    <h3>NeoFace AI Assistant</h3>
                                    <span className="ai-status">
                                        <span className="status-dot"></span>
                                        Online 24/7
                                    </span>
                                </div>
                            </div>
                            <div className="ai-chat-header-right">
                                <button
                                    className="ai-minimize-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Minimize"
                                >
                                    ➖
                                </button>
                                <button
                                    className="ai-close-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                >
                                    ✖
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="ai-quick-actions">
                            <p className="quick-actions-title">Quick Help:</p>
                            <div className="quick-actions-grid">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="quick-action-btn"
                                        onClick={() => handleQuickAction(action.query)}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="ai-chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`ai-message ${msg.type}`}>
                                    {msg.type === 'ai' && <div className="message-avatar">🤖</div>}
                                    <div className="message-content">
                                        <div className="message-text">{msg.text}</div>
                                        <div className="message-time">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {msg.type === 'user' && <div className="message-avatar">👤</div>}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="ai-message ai">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="ai-chat-input">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything about NeoFace..."
                                rows="2"
                            />
                            <button
                                className="ai-send-btn"
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim()}
                            >
                                <span className="send-icon">📤</span>
                                Send
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="ai-chat-footer">
                            <span className="footer-text">
                                💡 Powered by NeoFace AI • Available 24/7
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AISupportChat;
