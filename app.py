import requests
import json
import os
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = os.urandom(24)

def chat_with_llama(messages):
    url = "http://localhost:11434/api/chat"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "llama3.2",
        "messages": messages
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, stream=True)
        response.raise_for_status()
        
        full_response = ""
        for line in response.iter_lines():
            if line:
                try:
                    chunk = json.loads(line)
                    if 'message' in chunk and 'content' in chunk['message']:
                        content = chunk['message']['content']
                        full_response += content
                    elif 'error' in chunk:
                        return None
                except json.JSONDecodeError:
                    return None
                    
        return full_response if full_response else None
    except requests.RequestException:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message')
    
    # Initialize the conversation history in the session if it doesn't exist
    if 'messages' not in session:
        session['messages'] = [
            {"role": "system", "content": "You are a helpful AI assistant."}
        ]
    
    # Append the new user input to the conversation history
    session['messages'].append({"role": "user", "content": user_input})
    
    # Get the response from the model
    response = chat_with_llama(session['messages'])
    
    # Append the model's response to the conversation history
    if response is not None:
        session['messages'].append({"role": "assistant", "content": response})
        session.modified = True  # Ensure session is saved
    
    return response

if __name__ == '__main__':
    app.run(debug=True)