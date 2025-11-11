document.addEventListener('DOMContentLoaded', async function() {
    // Inicializa animações e rolagem suave
    initFadeInAnimations();
    initSmoothScroll();
    
    // Busca o token CSRF antes de configurar o formulário
    await fetchCsrfToken();
    initFormHandler();
});

// Handle animations
function initFadeInAnimations() {
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -100px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                appearOnScroll.unobserve(entry.target);
            }
        });
    }, appearOptions);
    
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
}

// Handle smooth scrolling
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Handle form submission
function initFormHandler() {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!contactForm) return;
    
    // Fetch CSRF token when page loads
    fetchCsrfToken();
    
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Desativar botão para evitar múltiplos envios
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
    
        // Capturar os valores do formulário corretamente
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            celular: document.getElementById('celular').value.trim(),
            message: document.getElementById('message').value.trim()
        };
    
        try {
            const response = await fetch('/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',  // 🔴 Enviando JSON
                    'X-Requested-With': 'XMLHttpRequest',
                    'CSRF-Token': csrfToken // 🔴 Inclui o token CSRF
                },
                credentials: 'include',
                body: JSON.stringify(formData) // 🔴 Convertendo para JSON
            });
    
            const result = await response.json();
    
            if (response.ok) {
                showFormStatus('success', 'Mensagem enviada com sucesso! Entraremos em contato em breve.');
                contactForm.reset();
            } else {
                showFormStatus('error', result.message || 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Error:', error);
            showFormStatus('error', 'Ocorreu um erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Mensagem';
        }
    });
}

let formTrackingTimeout;

contactForm.addEventListener('input', () => {
    clearTimeout(formTrackingTimeout);
    formTrackingTimeout = setTimeout(() => {
        const nome = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const celular = document.getElementById('celular').value.trim();
        const mensagem = document.getElementById('message').value.trim();

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'formulario_preenchido',
            nome: nome,
            email: email,
            celular: celular,
            mensagem: mensagem
        });
    }, 800); // aguarda 800ms após parar de digitar
});



// Fetch CSRF token


let csrfToken = '';

async function fetchCsrfToken() {
    try {
        const response = await fetch('/get-csrf-token', {
            credentials: 'include' 
        });
        const data = await response.json();
        
        if (response.ok && data.csrfToken) {
            csrfToken = data.csrfToken; 
        } else {
            console.error('Falha ao obter token CSRF');
        }
    } catch (error) {
        console.error('Erro ao buscar token CSRF:', error);
    }
}

// Display form status messages
function showFormStatus(type, message) {
    const formStatus = document.getElementById('formStatus');
    formStatus.textContent = message;
    formStatus.className = `form-status ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        formStatus.className = 'form-status';
    }, 5000);
}
