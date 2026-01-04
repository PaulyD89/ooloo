'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const BOT_NAMES = [
  'Luna',
  'Max',
  'Sophie',
  'Oliver',
  'Mia',
  'Leo',
  'Zoe',
  'Finn',
  'Ava',
  'Jasper',
  'Ruby',
  'Sam',
  'Chloe',
  'Eli',
  'Nora'
]

const GREETING_TEMPLATES = [
  "Hi! 👋 I'm {name} from ooloo. What's your name?",
  "Hey there! I'm {name} from ooloo. Who do I have the pleasure of chatting with?",
  "Hello! 👋 {name} here from ooloo. What's your name?",
  "Hi! I'm {name} from ooloo. And you are...?",
  "Hey! 👋 I'm {name} from ooloo. What should I call you?",
  "Hello! I'm {name} from ooloo. Who am I chatting with today?",
  "Hi there! {name} from ooloo here. What's your name?",
  "Hey! I'm {name} from ooloo. And who's this?",
  "Hello! 👋 I'm {name} from ooloo. What's your name, friend?",
  "Hi! {name} here from ooloo. Who am I speaking with?",
  "Hey there! 👋 I'm {name} from ooloo. What can I call you?",
  "Hello! I'm {name} from ooloo. What's your name?",
  "Hi! I'm {name} from ooloo. Who do I have here?",
  "Hey! {name} from ooloo here. 👋 What's your name?",
  "Hello there! I'm {name} from ooloo. And you are?",
]

const RETURN_GREETINGS = [
  "Oh hey {userName}, you're back! 👋 What else can I help you with?",
  "Hey {userName}, welcome back! What can I help you with now?",
  "{userName}! Good to see you again! 👋 What else do you need?",
  "You're back, {userName}! How can I help you this time?",
  "Hey again {userName}! 👋 What else can I do for you?",
  "Welcome back {userName}! Got more questions for me?",
  "Oh hey {userName}, you're back! What's on your mind?",
  "{userName}! Nice to see you again! 👋 How can I help now?",
  "Hey {userName}! What else can I assist with?",
  "{userName}, welcome back! 👋 What can I do for you?"
]

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

// Pages where chat should be hidden
const HIDDEN_PATHS = ['/admin', '/driver', '/login']

export default function ChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [botName, setBotName] = useState('')
  const [userName, setUserName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastOpenTime, setLastOpenTime] = useState<number | null>(null)
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hide chat on admin/driver/login pages
  const shouldHide = HIDDEN_PATHS.some(path => pathname?.startsWith(path))
  
  if (shouldHide) {
    return null
  }

  const openChat = () => {
    if (!isOpen) {
      const now = Date.now()
      const isReturningWithinSession = lastOpenTime && (now - lastOpenTime) < SESSION_TIMEOUT && hasOpenedBefore
      
      if (isReturningWithinSession && botName) {
        // Same session, same bot, return greeting
        let returnGreeting = RETURN_GREETINGS[Math.floor(Math.random() * RETURN_GREETINGS.length)]
        returnGreeting = returnGreeting.replace('{userName}', userName || 'friend')
        setMessages(prev => [...prev, { role: 'assistant', content: returnGreeting }])
      } else {
        // New session or first time
        const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
        const greetingTemplate = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)]
        const greeting = greetingTemplate.replace('{name}', randomName)
        
        setBotName(randomName)
        setUserName('')
        setMessages([{ role: 'assistant', content: greeting }])
        setHasOpenedBefore(true)
      }
      
      setLastOpenTime(now)
    }
    setIsOpen(!isOpen)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Check if this might be an email for order lookup
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const emailMatch = userMessage.match(emailRegex);
      
      // Check if we're in "lookup mode" (last assistant message asked for email)
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
      const isLookupMode = lastAssistantMessage.toLowerCase().includes('email') && 
                          (lastAssistantMessage.toLowerCase().includes('order') || 
                           lastAssistantMessage.toLowerCase().includes('look up') ||
                           lastAssistantMessage.toLowerCase().includes('find'));

      let orderContext = '';
      
      if (emailMatch && isLookupMode) {
        // Try to look up orders
        const cleanEmail = emailMatch[0].trim()
        const lookupResponse = await fetch('/api/chat/lookup-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });
        
        const lookupData = await lookupResponse.json();
        
        if (lookupData.found && lookupData.orders.length > 0) {
          orderContext = `\n\n[ORDER LOOKUP RESULTS for ${cleanEmail}]:\n`;
          lookupData.orders.forEach((order: { orderNumber: string; fullId: string; status: string; deliveryDate: string; returnDate: string; city: string; total: string }) => {
            const directLink = `https://ooloo.vercel.app/order?id=${order.fullId}&email=${encodeURIComponent(cleanEmail)}`;
            orderContext += `Order #${order.orderNumber}: ${order.status}, ${order.city}, Delivery: ${order.deliveryDate}, Return: ${order.returnDate}, Total: $${order.total}\nDirect link: ${directLink}\n\n`;
          });
          orderContext += `Share the order details and provide the direct link so they can manage their order with one click. Keep the link on its own line.`;
        } else {
          orderContext = `\n\n[ORDER LOOKUP: No orders found for ${cleanEmail}. Let the customer know politely and ask if they might have used a different email.]`;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user' as const, content: userMessage + orderContext }].slice(1),
          botName,
          userName: userName || null
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Check if this is the first user message (likely their name)
      if (!userName && messages.length === 1) {
        // Extract name from response - simple heuristic
        const words = userMessage.split(' ')
        const possibleName = words[0].replace(/[^a-zA-Z]/g, '')
        if (possibleName.length >= 2 && possibleName.length <= 15) {
          setUserName(possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase())
        }
      }

      // Update userName if the API detected it
      if (data.detectedName) {
        setUserName(data.detectedName)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting. Please try again or email support@ooloo.co" 
      }])
    }

    setIsLoading(false)
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        aria-label="Open chat"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-cyan-500 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
            <img src="/oolooicon.png" alt="ooloo" className="h-8" />
            <div>
              <div className="font-semibold">{botName} from ooloo</div>
              <div className="text-xs text-cyan-100">We typically reply instantly</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-cyan-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <span dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\n/g, '<br />')
                        .replace(
                          /(https?:\/\/[^\s<>]+)/g, 
                          '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-cyan-600 hover:text-cyan-800">Manage Order</a>'
                        )
                    }} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-cyan-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-full transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}