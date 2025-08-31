'use client'

import React, { useState, useEffect } from 'react'
import { Send, Bot, User, IndianRupee, LayoutDashboard, MessageSquare, PlusCircle, ArrowLeft } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Legend } from 'recharts';

// --- TYPE DEFINITIONS ---
interface Transaction {
  description: string;
  amount: number;
  category: string;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
interface ChatSession {
  id: string;
  date: string;
  title: string;
  messages: Message[];
}

// --- START HYDRATION FIX ---
// This simple component wrapper prevents its children from rendering on the server.
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }
  return <>{children}</>;
};
// --- END HYDRATION FIX ---


// --- SIDEBAR COMPONENT (LHS) ---
const Sidebar = ({ sessions, activeSessionId, setActiveSessionId, startNewChat, setActiveView, activeView }: { 
  sessions: ChatSession[], 
  activeSessionId: string,
  setActiveSessionId: (id: string) => void,
  startNewChat: () => void,
  setActiveView: (view: 'chat' | 'dashboard') => void,
  activeView: string 
}) => {
  const navItemClasses = "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors";
  const activeClasses = "bg-blue-500 text-white";
  const inactiveClasses = "hover:bg-white/10";

  return (
    <div className="w-72 bg-black/20 backdrop-blur-md rounded-lg p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"><IndianRupee size={24} /></div>
        <h1 className="text-2xl font-bold">FinWise</h1>
      </div>
      <nav className="flex flex-col gap-2">
        <div onClick={() => setActiveView('chat')} className={`${navItemClasses} ${activeView === 'chat' ? activeClasses : inactiveClasses}`}><MessageSquare size={20} /><span>Chat</span></div>
        <div onClick={() => setActiveView('dashboard')} className={`${navItemClasses} ${activeView === 'dashboard' ? activeClasses : inactiveClasses}`}><LayoutDashboard size={20} /><span>Dashboard</span></div>
      </nav>
      <div className="mt-6 pt-4 border-t border-white/20 flex-1 flex flex-col overflow-y-auto">
        <h2 className="text-sm font-semibold text-white/60 mb-2 px-2">History</h2>
        <div className="flex flex-col gap-1">
          {sessions.map(session => (
            <div key={session.id} onClick={() => { setActiveSessionId(session.id); setActiveView('chat'); }} className={`text-sm p-2 rounded-md cursor-pointer truncate ${session.id === activeSessionId && activeView === 'chat' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <p className="font-medium">{session.title}</p>
              <p className="text-xs text-white/50">{session.date}</p>
            </div>
          ))}
        </div>
      </div>
       <button onClick={startNewChat} className="mt-4 flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold"><PlusCircle size={20} /> New Chat</button>
    </div>
  );
};


// --- DASHBOARD COMPONENT (RHS - Dashboard View) ---
const DashboardPanel = ({ transactions, totalIncome }: { transactions: Transaction[], totalIncome: number }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
  const staticCategories = ['Food', 'Shopping', 'Travelling', 'Other'];

  const categoryData = staticCategories.map(category => {
    const total = transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: category, value: total };
  }).filter(c => c.value > 0);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

  if (selectedCategory) {
    const filteredTransactions = transactions.filter(t => t.category === selectedCategory);
    return (
      <div className="flex-1 bg-black/20 backdrop-blur-md rounded-lg p-8 text-white overflow-y-auto">
        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 mb-6 text-blue-300 hover:text-blue-200"><ArrowLeft size={20} /> Back to Dashboard</button>
        <h1 className="text-3xl font-bold mb-6">Expenses for "{selectedCategory}"</h1>
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? filteredTransactions.map((t, i) => (
            <div key={i} className="flex justify-between items-center bg-white/10 p-4 rounded-lg">
              <div><p className="text-lg font-medium">{t.description}</p></div>
              <p className="text-lg font-bold">₹{t.amount.toLocaleString('en-IN')}</p>
            </div>
          )) : <p className="text-white/60">No transactions recorded for this category yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-md rounded-lg p-8 text-white overflow-y-auto">
      <h1 className="text-4xl font-bold text-center mb-10">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/10 p-6 rounded-lg flex flex-col items-center justify-center min-h-[250px]">
          <h3 className="text-xl font-semibold mb-2">Category Expense</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : <p className="text-white/50">No data for chart.</p> }
        </div>
        <div className="lg:col-span-1 grid grid-rows-3 gap-4">
          <div className="bg-white/10 p-4 rounded-lg"><h4 className="text-white/70">Total Expense</h4><p className="text-2xl font-bold">₹{totalExpense.toLocaleString('en-IN')}</p></div>
          <div className="bg-white/10 p-4 rounded-lg"><h4 className="text-white/70">Total Income</h4><p className="text-2xl font-bold text-green-400">₹{totalIncome.toLocaleString('en-IN')}</p></div>
          <div className="bg-white/10 p-4 rounded-lg"><h4 className="text-white/70">Current Balance</h4><p className="text-2xl font-bold text-yellow-400">₹{(totalIncome - totalExpense).toLocaleString('en-IN')}</p></div>
        </div>
        <div className="lg:col-span-1 bg-white/10 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">Expense Categories</h3>
          <ul className="space-y-2 text-center">
            {staticCategories.map(category => (<li key={category} onClick={() => setSelectedCategory(category)} className="font-medium p-2 rounded-md hover:bg-white/20 cursor-pointer transition-colors">➔ {category}</li>))}
          </ul>
        </div>
        <div className="lg:col-span-3 bg-white/10 p-6 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
           <h3 className="text-xl font-semibold mb-4">Category Totals</h3>
           {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#ffffff" />
                <YAxis stroke="#ffffff" />
                <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="value" name="Spent" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
           ) : <p className="text-white/50">No data for chart.</p>}
        </div>
      </div>
    </div>
  );
};


// --- CHAT COMPONENT (RHS - Chat View) ---
const ChatPanel = ({ activeSession, setSessions, activeSessionId, transactions, setTransactions, budgets, setBudgets, setTotalIncome }: any) => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return
    const userMessage: Message = { role: 'user', content: input }
    
    const isFirstMessage = activeSession.messages.length === 0;

    setSessions((prevSessions: ChatSession[]) => 
      prevSessions.map(session => 
        session.id === activeSessionId 
          ? { ...session, title: isFirstMessage ? input : session.title, messages: [...session.messages, userMessage] } 
          : session
      )
    );
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: input, transactions, budgets }) })
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API Error');
      }
      const result = await response.json()
      let assistantResponse = 'Got it!'
      
      switch (result.action) {
        case 'ADD_TRANSACTION':
          setTransactions((prev: Transaction[]) => [...prev, result.payload])
          const newTotal = transactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0) + result.payload.amount;
          assistantResponse = `Ok, I've logged ₹${result.payload.amount} for "${result.payload.description}". Your total spending is now ₹${newTotal.toLocaleString('en-IN')}.`
          break
        case 'ADD_INCOME':
          setTotalIncome((prev: number) => prev + result.payload.amount);
          assistantResponse = `Great! I've added ₹${result.payload.amount.toLocaleString('en-IN')} from "${result.payload.description}" to your income.`;
          break;
        case 'SET_BUDGET':
          setBudgets((prev: any) => ({ ...prev, [result.payload.category]: result.payload.amount }))
          assistantResponse = `Budget for ${result.payload.category} set to ₹${result.payload.amount}.`
          break
        case 'ANSWER_QUESTION': case 'GENERAL_MESSAGE':
          assistantResponse = result.payload.response
          break
      }

      const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
      setSessions((prevSessions: ChatSession[]) => 
        prevSessions.map(session => session.id === activeSessionId ? { ...session, messages: [...session.messages, assistantMessage] } : session)
      );

    } catch (error: any) {
      console.error('Send message error:', error)
      const errorMessage: Message = { role: 'assistant', content: `Sorry, an error occurred: ${error.message}` };
      setSessions((prevSessions: ChatSession[]) => 
        prevSessions.map(session => session.id === activeSessionId ? { ...session, messages: [...session.messages, errorMessage] } : session)
      );
    } finally { setIsLoading(false) }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-md rounded-lg p-6 flex flex-col shadow-lg text-white">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-black/20 rounded-md">
        {activeSession && activeSession.messages.map((message: Message, index: number) => (<div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}> {message.role === 'assistant' && <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Bot size={16} /></div>} <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white/90 text-gray-800 rounded-bl-none'}`}><p className="whitespace-pre-wrap">{message.content}</p></div> {message.role === 'user' && <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"><User size={16} /></div>}</div>))}
        {isLoading && (<div className="flex items-start gap-3"><div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Bot size={16} /></div><div className="bg-white/90 px-4 py-2 rounded-lg rounded-bl-none"><div className="flex space-x-1"><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div><div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div></div></div></div>)}
      </div>
      <div className="flex space-x-4">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="e.g., 'Spent 500 on groceries'" className="flex-1 bg-white/20 text-white placeholder-white/60 px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" rows={1} disabled={isLoading} />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"><Send size={20} /><span>Send</span></button>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const [activeView, setActiveView] = useState<'chat' | 'dashboard'>('chat');
  const initialSessionId = React.useId();
  const [sessions, setSessions] = useState<ChatSession[]>([{ id: initialSessionId, date: new Date().toLocaleDateString(), title: 'New Chat Session', messages: [] }]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId);
  const [transactions, setTransactions] = useState<Transaction[]>([{ description: 'Groceries for the week', amount: 2500, category: 'Food' },{ description: 'New T-shirt', amount: 1200, category: 'Shopping' },{ description: 'Bus ticket to downtown', amount: 150, category: 'Travelling' },{ description: 'Phone bill', amount: 500, category: 'Other' },{ description: 'Coffee', amount: 350, category: 'Food' },]);
  const [budgets, setBudgets] = useState<any>({});
  const [totalIncome, setTotalIncome] = useState(150000);

  const startNewChat = () => {
    const newSession: ChatSession = { id: `session-${Date.now()}`, date: new Date().toLocaleDateString(), title: `New Chat Session`, messages: [] };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <main className="min-h-screen p-4">
      <div className="h-[calc(100vh-2rem)] flex gap-4">
        {/* --- START HYDRATION FIX --- */}
        <ClientOnly>
          <Sidebar sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId} startNewChat={startNewChat} setActiveView={setActiveView} activeView={activeView} />
        </ClientOnly>
        {/* --- END HYDRATION FIX --- */}

        {activeView === 'chat' ? (
          <ChatPanel activeSession={activeSession} setSessions={setSessions} activeSessionId={activeSessionId} transactions={transactions} setTransactions={setTransactions} budgets={budgets} setBudgets={setBudgets} setTotalIncome={setTotalIncome} />
        ) : (
          <DashboardPanel transactions={transactions} totalIncome={totalIncome} />
        )}
      </div>
    </main>
  );
}