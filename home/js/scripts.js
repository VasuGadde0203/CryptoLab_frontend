// Chatbot Functionality
const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');

// Handle logout modal
const logoutBtn = document.getElementById('logout-btn');
const logoutModal = document.getElementById('logout-modal');
const logoutConfirm = document.getElementById('logout-confirm');
const logoutCancel = document.getElementById('logout-cancel');

// Show modal when logout button is clicked
logoutBtn.addEventListener('click', function() {
    logoutModal.classList.remove('hidden');
    setTimeout(() => {
        logoutModal.querySelector('div').classList.remove('scale-95');
        logoutModal.classList.remove('opacity-0');
    }, 10);
});

// Confirm logout
logoutConfirm.addEventListener('click', function() {
    // Clear JWT token from localStorage
    localStorage.removeItem('access_token');
    // Redirect to login page
    window.location.href = '/frontend/auth/auth.html';
});

// Cancel logout (hide modal)
logoutCancel.addEventListener('click', function() {
    logoutModal.classList.add('opacity-0');
    logoutModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        logoutModal.classList.add('hidden');
    }, 300);
});

// Close modal when clicking on the overlay
logoutModal.addEventListener('click', function(e) {
    if (e.target === logoutModal) {
        logoutModal.classList.add('opacity-0');
        logoutModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            logoutModal.classList.add('hidden');
        }, 300);
    }
});

// Check if chatbot icon exists before adding event listener
if (!chatbotIcon) {
    console.error('Chatbot icon element not found in the DOM');
} else {
    // Toggle chatbot visibility
    chatbotIcon.addEventListener('click', () => {
        console.log('Chatbot icon clicked');
        const isVisible = chatbotContainer.style.display === 'flex';
        chatbotContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            chatbotInput.focus();
            scrollToBottom();
        }
    });
}

// Close chatbot
chatbotClose.addEventListener('click', () => {
    console.log('Chatbot close button clicked');
    chatbotContainer.style.display = 'none';
});

// Send message on button click
chatbotSend.addEventListener('click', sendMessage);

// Send message on Enter key
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Function to format the chatbot response into HTML
function formatResponse(text) {
    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/&/g, '&')
                  .replace(/</g, '<')
                  .replace(/>/g, '>')
                  .replace(/"/g, '"')
                  .replace(/'/g, '');
    }

    // Replace **text** with <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split the text into paragraphs (separated by double newlines)
    const paragraphs = text.split(/\n\n/).filter(p => p.trim() !== '');

    let html = '';
    let inOrderedList = false;
    let inUnorderedList = false;
    let currentListItems = [];

    paragraphs.forEach(paragraph => {
        // Split paragraph into lines
        const lines = paragraph.split('\n').filter(line => line.trim() !== '');

        let paragraphHTML = '';
        lines.forEach((line, index) => {
            // Check for numbered list items (e.g., "1. Buy at an Exchange")
            const numberedMatch = line.match(/^\d+\.\s*(.+)/);
            // Check for bullet points (e.g., "- Bitcoin ATMs")
            const bulletMatch = line.match(/^\-\s*(.+)/);
            // Check if the line is a continuation of a previous list item (starts with spaces)
            const continuationMatch = line.match(/^\s{2,}(.+)/);

            if (numberedMatch) {
                // If we were in an unordered list, close it
                if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    currentListItems = [];
                    inUnorderedList = false;
                }
                // Start or continue an ordered list
                if (!inOrderedList) {
                    inOrderedList = true;
                }
                currentListItems.push(`<li>${escapeHTML(numberedMatch[1])}</li>`);
            } else if (bulletMatch) {
                // If we were in an ordered list, close it
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    currentListItems = [];
                    inOrderedList = false;
                }
                // Start or continue an unordered list
                if (!inUnorderedList) {
                    inUnorderedList = true;
                }
                currentListItems.push(`<li>${escapeHTML(bulletMatch[1])}</li>`);
            } else if (continuationMatch && (inOrderedList || inUnorderedList)) {
                // Continuation of the previous list item
                const lastItemIndex = currentListItems.length - 1;
                if (lastItemIndex >= 0) {
                    currentListItems[lastItemIndex] = currentListItems[lastItemIndex].replace(
                        '</li>',
                        ` ${escapeHTML(continuationMatch[1])}</li>`
                    );
                }
            } else {
                // Close any open lists
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    currentListItems = [];
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    currentListItems = [];
                    inUnorderedList = false;
                }
                // Treat as a regular paragraph
                paragraphHTML += `<p>${escapeHTML(line)}</p>`;
            }

            // If this is the last line, close any open lists
            if (index === lines.length - 1) {
                if (inOrderedList) {
                    paragraphHTML += `<ol>${currentListItems.join('')}</ol>`;
                    inOrderedList = false;
                    currentListItems = [];
                } else if (inUnorderedList) {
                    paragraphHTML += `<ul>${currentListItems.join('')}</ul>`;
                    inUnorderedList = false;
                    currentListItems = [];
                }
            }
        });

        html += paragraphHTML;
    });

    return html || '<p>No content available.</p>';
}

// Function to send message and get response
async function sendMessage() {
    const query = chatbotInput.value.trim();
    if (!query) {
        console.warn('Empty query entered');
        return;
    }

    console.log('Sending message:', query);

    // Add user's message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'chatbot-message user';
    userMessage.textContent = query;
    chatbotMessages.appendChild(userMessage);

    // Clear input
    chatbotInput.value = '';

    // Scroll to bottom
    scrollToBottom();

    // Add loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chatbot-message bot loading';
    chatbotMessages.appendChild(loadingMessage);
    scrollToBottom();

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token found');
        }

        console.log('Fetching response from chatbot API...');
        const response = await fetch('http://localhost:8000/chat/query', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        console.log('Chatbot API response status:', response.status);
        if (!response.ok) {
            throw new Error(`Chatbot API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Chatbot response:', data);

        // Remove loading indicator
        loadingMessage.remove();

        // Format and add bot's response to chat
        const botMessage = document.createElement('div');
        botMessage.className = 'chatbot-message bot';
        botMessage.innerHTML = formatResponse(data.answer || 'Sorry, I couldn’t find an answer to that.');
        chatbotMessages.appendChild(botMessage);
    } catch (error) {
        console.error('Error fetching chatbot response:', error);
        loadingMessage.remove();
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chatbot-message bot';
        errorMessage.textContent = 'Error: Unable to get a response. Please try again.';
        chatbotMessages.appendChild(errorMessage);
    }

    scrollToBottom();
}

// Function to scroll to the bottom of the chat
function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Initialize page on load
console.log('Page loaded, initializing...');