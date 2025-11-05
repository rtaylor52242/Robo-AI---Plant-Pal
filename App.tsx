
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateGeminiResponse } from './services/geminiService';
import { Author, Message } from './types';

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-dark">
    <path d="M11 20A7 7 0 0 1 4 13V8a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1.5a6.5 6.5 0 0 1-5.5 6.4" />
    <path d="M11 14V3" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BotIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);


const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isBot = message.author === Author.BOT;

  return (
    <div className={`flex items-start gap-3 ${isBot ? '' : 'justify-end'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-primary' : 'bg-gray-300'}`}>
        {isBot ? <BotIcon /> : <UserIcon />}
      </div>
      <div className={`max-w-xs md:max-w-md lg:max-w-2xl p-4 rounded-2xl ${isBot ? 'bg-white dark:bg-gray-700 rounded-tl-none' : 'bg-primary text-white rounded-br-none'}`}>
        {message.image && (
          <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-h-60" />
        )}
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        author: Author.BOT,
        text: "Hello! I'm Robo AI - Plant Pal 🌱. Upload a photo of a plant, and I'll identify it and provide care instructions. You can also ask me any gardening questions!",
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [imagePreview]);

  const handleSend = useCallback(async () => {
    if ((!userInput.trim() && !imageFile) || isLoading) return;

    const currentInput = userInput;
    const currentImageFile = imageFile;
    const currentImagePreview = imagePreview;

    const userMessage: Message = {
      author: Author.USER,
      text: currentInput,
      image: currentImagePreview ?? undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    setUserInput('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsLoading(true);

    const prompt = currentInput.trim() ? currentInput : "Identify this plant and provide detailed care instructions. Format the response using Markdown with headings for different sections like 'Watering', 'Sunlight', 'Soil', and 'Common Pests'.";
    
    try {
      const botResponseText = await generateGeminiResponse(prompt, currentImageFile);
      const botMessage: Message = { author: Author.BOT, text: botResponseText };
      setMessages((prev) => [...prev, botMessage]);
    } catch (e: any) {
        const errorMessage = "Sorry, something went wrong. Please try again.";
        const botMessage: Message = { author: Author.BOT, text: errorMessage };
        setMessages((prev) => [...prev, botMessage]);
    } finally {
        setIsLoading(false);
        if (currentImagePreview) {
            URL.revokeObjectURL(currentImagePreview);
        }
    }
  }, [userInput, imageFile, isLoading, imagePreview]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex items-center gap-3">
        <LeafIcon/>
        <h1 className="text-xl font-bold">Robo AI - Plant Pal</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary">
              <BotIcon />
            </div>
            <div className="max-w-xs p-4 rounded-2xl bg-white dark:bg-gray-700 rounded-tl-none flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>
      
      <footer className="bg-white dark:bg-gray-900 p-4 shadow-t-md">
        <div className="max-w-4xl mx-auto">
          {imagePreview && (
            <div className="mb-2 relative w-28 h-28">
              <img src={imagePreview} alt="Selected plant" className="w-full h-full object-cover rounded-lg" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                <XIcon />
              </button>
            </div>
          )}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                aria-label="Attach image"
            >
              <PaperclipIcon />
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your plant..."
              className="flex-1 bg-transparent focus:outline-none resize-none p-2"
              rows={1}
            />
            <button onClick={handleSend} disabled={isLoading || (!userInput.trim() && !imageFile)} className="p-2 rounded-full bg-primary text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              <SendIcon />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;