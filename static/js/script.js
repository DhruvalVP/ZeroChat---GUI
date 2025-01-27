document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const botResponse = await response.text();
            appendMessage('bot', botResponse);
        } catch (error) {
            console.error('Error:', error);
            appendMessage('bot', 'Sorry, there was an error processing your message.');
        }
    });

    function appendMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        
        // Process the content
        const processedContent = processMessageContent(content);
        
        messageDiv.innerHTML = processedContent;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function processMessageContent(content) {
        // Preserve newline characters
        content = content.replace(/\n/g, '<br>');

        // Style bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Style italic text
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Style code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const languageClass = language ? ` class="language-${language}"` : '';
            const languageTitle = language ? language : 'Code';
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span${languageClass}>${languageTitle}</span>
                        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    </div>
                    <pre><code${languageClass}>${escapeHtml(code.trim())}</code></pre>
                </div>
            `;
        });

        return content;
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});

function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}