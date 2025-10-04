import { useState } from 'react';
import './App.css';

  // We use a newer, more efficient model from the Gemini family.
  const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
  // IMPORTANT: The API key is left as an empty string. 
  // In this secure environment, it's automatically provided during the API call.
  // This prevents exposing your key in the client-side code.
  const API_KEY = ""; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
// The URL for the Google Gemini API

function App() {
  // State variables to store our application's data
  const [conversation, setConversation] = useState([
    { role: 'model', text: 'Hello! Please tell me a memory you would like to save.' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // This function is called when the user types in the input box
  const handleInputChange = (e) => {
    setCurrentMessage(e.target.value);
  };

  // This function is called when the user clicks the "Send" button
  const handleSendMessage = (e) => {
    e.preventDefault(); // Prevents the page from reloading
    if (!currentMessage.trim()) return; // Don't send empty messages

    // Add the user's message to the conversation
    const newUserMessage = { role: 'user', text: currentMessage };
    // Add a follow-up prompt from the "model" to guide the user
    const modelPrompt = { role: 'model', text: 'That sounds interesting! Can you tell me more, or share another memory?' };

    setConversation([...conversation, newUserMessage, modelPrompt]);
    setCurrentMessage(''); // Clear the input box
  };

  // This is the main function that talks to the Google Gemini AI
  const handleGenerateStory = async () => {
    setIsLoading(true); // Show a loading message
    setError(null);
    setGeneratedStory('');

    // Format the conversation history into a single block of text for the AI
    const conversationText = conversation.map(msg => `${msg.role === 'user' ? 'Person' : 'Interviewer'}: ${msg.text}`).join('\n');

    // This is the "prompt" we send to the AI. We give it instructions.
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
      // Make the API call using fetch
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        // If the API gives an error, we show it
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract the story text from the API's response
      const storyText = data.candidates[0]?.content?.parts[0]?.text;
      
      if (storyText) {
        setGeneratedStory(storyText);
      } else {
        throw new Error("Couldn't find story text in the API response.");
      }

    } catch (err) {
      // Handle any errors that happen during the API call
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false); // Hide the loading message
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Grandma's Memory Keeper 👵</h1>
        <p>Share your memories, and we'll turn them into a beautiful story.</p>
      </header>

      <div className="chat-container">
        {/* Display the conversation history */}
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
            {/* We use pre-wrap to respect new lines from the AI */}
            <p style={{ whiteSpace: 'pre-wrap' }}>{generatedStory}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;