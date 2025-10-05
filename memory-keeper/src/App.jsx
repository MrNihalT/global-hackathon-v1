import { useState } from 'react';
import './App.css';


  const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
  
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;


function App() {

  const [conversation, setConversation] = useState([
    { role: 'model', text: 'Hello! Please tell me a memory you would like to save.' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setCurrentMessage(e.target.value);
  };


  const handleSendMessage = (e) => {
    e.preventDefault(); 
    if (!currentMessage.trim()) return; 


    const newUserMessage = { role: 'user', text: currentMessage };

    const modelPrompt = { role: 'model', text: 'That memory interesting! Can you tell me more, or share another memory?' };

    setConversation([...conversation, newUserMessage, modelPrompt]);
    setCurrentMessage(''); 
  };


  const handleGenerateStory = async () => {
    setIsLoading(true); 
    setError(null);
    setGeneratedStory('');

   
    const conversationText = conversation.map(msg => `${msg.role === 'user' ? 'Person' : 'Interviewer'}: ${msg.text}`).join('\n');

   
    const prompt = `
      You are a compassionate biographer. Your task is to take the following interview conversation and transform it into a beautiful, short, first-person story.
      Capture the emotions and details shared by the person. Write it as if they are telling the story themselves.
      Do not include the "Interviewer" parts in the final story.

      Here is the conversation:
      ---
      ${conversationText}
      ---

      Now, please write the story:
    `;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      

      const storyText = data.candidates[0]?.content?.parts[0]?.text;
      
      if (storyText) {
        setGeneratedStory(storyText);
      } else {
        throw new Error("Couldn't find story text in the API response.");
      }

    } catch (err) {

      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Grandma's Memory Keeper 👵</h1>
        <p>Share your memories, and we'll turn them into a beautiful story.</p>
      </header>

      <div className="chat-container">
       
        {conversation.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={currentMessage}
          onChange={handleInputChange}
          placeholder="Type your memory here..."
          aria-label="Your memory"
        />
        <button type="submit">Send</button>
      </form>

      <div className="story-section">
        <button onClick={handleGenerateStory} disabled={isLoading || conversation.length <= 1}>
          {isLoading ? 'Generating...' : '✨ Create My Story'}
        </button>

        {error && <div className="error-message">Error: {error}</div>}
        
        {generatedStory && (
          <div className="story-result">
            <h2>Your Generated Story</h2>
          
            <p style={{ whiteSpace: 'pre-wrap' }}>{generatedStory}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;