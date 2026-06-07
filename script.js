﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿// script.js

// --- Certificate Modal Logic (Now opens in new centered window) ---
function openCertModal(imageSrc, title) {
    let width = 1000;
    let height = 750;

    // Adjust size for badges which are typically square
    if (title.toLowerCase().includes('badge')) {
        width = 600;
        height = 600;
    }

    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(imageSrc, '_blank', `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
}

function closeCertModal() {
    // This is no longer needed but kept for compatibility if called elsewhere
    const modal = document.getElementById('cert-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = ''; 
}

// --- Mobile Menu Toggle ---
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.nav-link-mobile');

mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// --- Navbar Scroll Effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('py-3');
        navbar.classList.remove('py-5');
        navbar.classList.add('shadow-lg');
    } else {
        navbar.classList.add('py-5');
        navbar.classList.remove('py-3');
        navbar.classList.remove('shadow-lg');
    }
});

// --- Active Link Switching ---
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
let isManualScrolling = false;

// Function to update active link
function updateActiveLink(targetId) {
    navLinks.forEach(link => {
        link.classList.remove('text-accent');
        link.classList.add('text-white');
        if (link.getAttribute('href') === targetId || (targetId.startsWith('#') && link.getAttribute('href') === targetId)) {
            link.classList.add('text-accent');
            link.classList.remove('text-white');
        }
    });
}

// Handle click on nav links to center the section
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                isManualScrolling = true;
                
                // Highlight the clicked link immediately
                updateActiveLink(targetId);

                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL hash without jumping
                history.pushState(null, null, targetId);

                // Reset flag after scroll animation finishes (approx 800ms)
                setTimeout(() => {
                    isManualScrolling = false;
                }, 800);
            }
        }
    });
});

window.addEventListener('scroll', () => {
    // Only update active link based on scroll position if we're not in a manual scroll
    if (isManualScrolling) return;

    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    if (current) {
        updateActiveLink('#' + current);
    }
});

// --- Scroll Reveal Animation ---
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
  
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementBottom = reveals[i].getBoundingClientRect().bottom;
        var revealPoint = 100;
  
        // If element is in view
        if (elementTop < windowHeight - revealPoint && elementBottom > revealPoint) {
            reveals[i].classList.add("active");
        } else {
            // Remove active class when out of view to allow re-triggering
            // We use a bit of buffer so it doesn't disappear too abruptly
            if (elementTop > windowHeight || elementBottom < 0) {
                reveals[i].classList.remove("active");
            }
        }
    }
}
window.addEventListener("scroll", reveal);
// Trigger on load for elements already in view
document.addEventListener("DOMContentLoaded", reveal);



// --- Typewriter Effect ---
const typewriterText = document.getElementById('typewriter-text');
const roles = [
    "Software Engineer",
    "Startup Co-Founder",
    "AI & Machine Learning Engineer",
    "Full-Stack Developer",
    "Author & Creative Writer"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
        typewriterText.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typewriterText.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }
    
    // Typing speed feels natural, deleting is slightly faster
    let typeSpeed = isDeleting ? 40 : 100;
    
    if (!isDeleting && charIndex === currentRole.length) {
        // Pause for a moment so it is fully readable
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        // Move to next role
        roleIndex = (roleIndex + 1) % roles.length;
        // Brief pause before typing next
        typeSpeed = 500;
    }
    
    setTimeout(type, typeSpeed);
}

document.addEventListener("DOMContentLoaded", () => {
    if(typewriterText) {
        setTimeout(type, 500); // Initial start delay
    }
});

// --- Real-Time Clock ---
function updateClock() {
    const clockElement = document.getElementById('local-clock');
    if (!clockElement) return;

    // Sri Lanka is UTC+5:30
    const now = new Date();
    const options = { 
        timeZone: 'Asia/Colombo', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    };
    
    const timeString = new Intl.DateTimeFormat('en-US', options).format(now);
    clockElement.textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();

// --- Theme Toggle (Visual Only) ---
const themeToggle = document.getElementById('theme-toggle');
const themeCircle = document.getElementById('theme-toggle-circle');
const themeIcon = document.getElementById('theme-toggle-icon');

if (themeToggle) {
    let isDark = true;
    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        document.body.classList.toggle('light-mode', !isDark);
        
        if (isDark) {
            // Dark Mode State
            themeCircle.classList.remove('translate-x-0', 'bg-white');
            themeCircle.classList.add('translate-x-6', 'bg-accent');
            themeIcon.className = 'fa-solid fa-moon text-[10px] text-black';
        } else {
            // Light Mode State
            themeCircle.classList.remove('translate-x-6', 'bg-accent');
            themeCircle.classList.add('translate-x-0', 'bg-white');
            themeIcon.className = 'fa-solid fa-sun text-[10px] text-black';
        }
    });
}

// --- AI Chat Widget Logic ---
let isChatOpen = false;

function toggleChat() {
    const chatPanel = document.getElementById('chat-panel');
    const fabButton = document.getElementById('chat-fab');
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        // Open
        chatPanel.classList.remove('hidden');
        // Small delay to allow display:block to apply before animating opacity/transform
        setTimeout(() => {
            chatPanel.classList.remove('translate-y-8', 'opacity-0', 'pointer-events-none');
            chatPanel.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }, 10);
        
        // Hide FAB completely
        fabButton.classList.add('opacity-0', 'scale-0', 'pointer-events-none');
    } else {
        // Close
        chatPanel.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        chatPanel.classList.add('translate-y-8', 'opacity-0', 'pointer-events-none');
        
        // Show FAB back
        fabButton.classList.remove('opacity-0', 'scale-0', 'pointer-events-none');
        
        setTimeout(() => {
            chatPanel.classList.add('hidden');
        }, 300); // match duration-300
    }
}

async function handleChatSubmit(event) {
    event.preventDefault();
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('chat-history');
    const submitBtn = document.querySelector('#chat-form button[type="submit"]');

    // Add User Message
    const userMsgHTML = `
        <div class="flex items-start justify-end gap-2 ml-auto max-w-[85%]">
            <div class="bg-accent text-black p-3 rounded-2xl rounded-tr-sm font-medium">
                ${message}
            </div>
            <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <i class="fa-solid fa-user text-[10px] text-gray-300"></i>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', userMsgHTML);
    inputField.value = '';
    inputField.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add Typing Indicator
    const typingId = 'typing-' + Date.now();
    const typingHTML = `
        <div id="${typingId}" class="flex items-start gap-2 max-w-[85%] animate-fade-in">
            <div class="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                <i class="fa-solid fa-robot text-xs"></i>
            </div>
            <div class="bg-white/10 text-gray-200 p-3 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1">
                <span class="text-xs italic text-gray-400">Dilni's AI Twin is typing</span>
                <span class="flex gap-1 ml-2">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </span>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', typingHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('http://localhost:8888/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message,
                session_id: 'dilni_portfolio_session' // Could be dynamic
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Server error');
        }

        // Remove typing indicator before starting stream
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        // Create AI message container for streaming
        const aiMsgId = 'ai-msg-' + Date.now();
        const aiMsgHTML = `
            <div id="${aiMsgId}" class="flex items-start gap-2 max-w-[85%] animate-fade-in">
                <div class="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-1">
                    <i class="fa-solid fa-robot text-xs"></i>
                </div>
                <div class="ai-content bg-white/10 text-gray-200 p-3 rounded-2xl rounded-tl-sm border border-white/5 whitespace-pre-wrap text-sm"></div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', aiMsgHTML);
        const aiContentEl = document.getElementById(aiMsgId).querySelector('.ai-content');

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep partial line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.replace('data: ', '');
                        const data = JSON.parse(jsonStr);

                        if (data.text) {
                            aiContentEl.textContent += data.text;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }

                        if (data.command) {
                            const parts = data.command.split('::');
                            const action = parts[1];
                            const target = parts[2];

                            if (action === 'scroll') {
                                setTimeout(() => {
                                    const targetSection = document.getElementById(target);
                                    if (targetSection) {
                                        isManualScrolling = true;
                                        updateActiveLink('#' + target);
                                        
                                        targetSection.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'start'
                                        });

                                        setTimeout(() => {
                                            isManualScrolling = false;
                                        }, 800);
                                    }
                                }, 300);
                            } else if (action === 'download' && target === 'resume') {
                                const link = document.createElement('a');
                                link.href = './Dilni_Rohansi_Wijesinghe_cv.pdf';
                                link.download = 'Dilni_Rohansi_Wijesinghe_CV.pdf';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk", e);
                    }
                }
            }
        }

    } catch (error) {
        // Remove typing indicator
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        console.error("Chat Error:", error);
        const errorMsgHTML = `
            <div class="flex items-start gap-2 max-w-[85%] animate-fade-in">
                <div class="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <i class="fa-solid fa-circle-exclamation text-xs"></i>
                </div>
                <div class="bg-white/10 text-gray-200 p-3 rounded-2xl rounded-tl-sm border border-red-500/30 text-sm">
                    Sorry, my AI twin is currently resting! Please use the contact form below to reach me directly. 
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', errorMsgHTML);
    } finally {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        inputField.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        inputField.focus();
    }
}
