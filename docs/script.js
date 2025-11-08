// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Allow # links without targets to work normally
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .api-card, .workflow-step, .user-card');
    animatedElements.forEach(el => observer.observe(el));

    // Add active state to navigation based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    function highlightNav() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNav);

    // Demo message typing effect
    const demoMessages = [
        "Hey can we just add a quick contact form? Real quick, shouldn't be hard!",
        "Can we also add a few animations? While you're at it!",
        "One more thing - can we add a blog section? Should be easy!",
        "Real quick - can we change the entire color scheme?"
    ];

    let currentMessageIndex = 0;
    const clientMessageElement = document.querySelector('.demo-message');

    function rotateMessages() {
        if (clientMessageElement) {
            clientMessageElement.style.opacity = '0';
            
            setTimeout(() => {
                currentMessageIndex = (currentMessageIndex + 1) % demoMessages.length;
                const messageContent = clientMessageElement.querySelector('strong').nextSibling;
                messageContent.textContent = ` "${demoMessages[currentMessageIndex]}"`;
                clientMessageElement.style.opacity = '1';
            }, 500);
        }
    }

    // Rotate messages every 5 seconds
    if (clientMessageElement) {
        clientMessageElement.style.transition = 'opacity 0.5s ease';
        setInterval(rotateMessages, 5000);
    }

    // Add click tracking for CTA buttons (for analytics)
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-outline');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = button.textContent.trim();
            console.log(`CTA clicked: ${buttonText}`);
            // Here you could add analytics tracking
            // e.g., gtag('event', 'cta_click', { button_text: buttonText });
        });
    });

    // Mobile menu toggle (if needed in future)
    const createMobileMenu = () => {
        const navbar = document.querySelector('.navbar .container');
        const navLinks = document.querySelector('.nav-links');
        
        // Only create mobile menu on small screens
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle';
            toggle.innerHTML = '☰';
            toggle.setAttribute('aria-label', 'Toggle menu');
            
            toggle.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
                toggle.innerHTML = navLinks.classList.contains('mobile-open') ? '✕' : '☰';
            });
            
            navbar.insertBefore(toggle, navLinks);
        }
    };

    // Check for mobile on load and resize
    createMobileMenu();
    window.addEventListener('resize', createMobileMenu);

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        });
    }

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple effect dynamically
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .animate-in {
            animation: fadeInUp 0.6s ease-out;
        }
        
        .nav-links a.active {
            color: var(--primary-color);
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .mobile-menu-toggle {
                display: block;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--text-dark);
                cursor: pointer;
                padding: 0.5rem;
            }
            
            .nav-links {
                position: fixed;
                top: 60px;
                right: -100%;
                background: white;
                width: 70%;
                height: calc(100vh - 60px);
                flex-direction: column;
                padding: 2rem;
                box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
            }
            
            .nav-links.mobile-open {
                right: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize pricing calculator (placeholder for future feature)
    const pricingCards = document.querySelectorAll('.pricing-card button');
    pricingCards.forEach(button => {
        button.addEventListener('click', () => {
            const plan = button.closest('.pricing-card').querySelector('h3').textContent;
            console.log(`Selected plan: ${plan}`);
            // Future: Show modal or redirect to signup
            alert(`Thanks for your interest in the ${plan} plan! Visit our GitHub to get started.`);
        });
    });

    // Easter egg: Konami code
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-10);
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            document.body.style.animation = 'rainbow 3s linear infinite';
            setTimeout(() => {
                document.body.style.animation = '';
                alert('🎉 You found the easter egg! You\'re now immune to scope creep... for 5 minutes. 😄');
            }, 3000);
        }
    });

    const rainbowStyle = document.createElement('style');
    rainbowStyle.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(rainbowStyle);
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Console message for developers
console.log('%c🛡️ Scope Creep Insurance', 'font-size: 24px; font-weight: bold; color: #4f46e5;');
console.log('%cLooking under the hood? We like your style!', 'font-size: 14px; color: #6b7280;');
console.log('%cCheck out our API: https://github.com/jmenichole/Scope-Creep', 'font-size: 12px; color: #10b981;');
