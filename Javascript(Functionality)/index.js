// Hamburger Toogle
let hamIcon = document.getElementById('mobile-toggle');
let mobileMenu = document.getElementById('mobile-menu');
let openIcon =  document.getElementById('hamburger-icon')
let closeIcon = document.getElementById('close-icon');


hamIcon.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
     openIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
})



// Theme Switcher (Light and Dark Mode) & remembering theme preference on reload
let toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}






// Typewriter Effect
let typeWriterEffect = document.getElementById('typewriter');
const subPhrases = [
    'Simulate Real CBT Experience',
    'Timed Mock Examinations',
    'Instant Performance Analysis'
    
]
let currentIndex = 0;
let letterIndex = 0;
let deleting = false;
let currentPhrase = subPhrases[currentIndex];

function typeWriter() {
    if (deleting) {
        typeWriterEffect.textContent = currentPhrase.substring(0, letterIndex - 1);
        letterIndex--;
    } else {
        typeWriterEffect.textContent = currentPhrase.substring(0, letterIndex + 1);
        letterIndex++;
    }

    if (!deleting && letterIndex === currentPhrase.length) {
        deleting = true;
        setTimeout(typeWriter, 1000);
    } else if (deleting && letterIndex === 0) {
        deleting = false;
        currentIndex = (currentIndex + 1) % subPhrases.length;
        currentPhrase = subPhrases[currentIndex];
        setTimeout(typeWriter, 500);
    } else {
        setTimeout(typeWriter, 100);
    }
}

typeWriter();

// FAQ Toggle
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    const button = item.querySelector(".faq-btn");
    const answer = item.querySelector(".faq-answer");
    const icon = item.querySelector(".faq-icon");

    button.addEventListener("click", () => {
        const isOpen = answer.classList.contains("max-h-40");
        faqItems.forEach(i => {
            i.querySelector(".faq-answer").classList.remove("max-h-40");
            i.querySelector(".faq-icon").classList.remove("rotate-180");
        });

        if (!isOpen) {
            answer.classList.add("max-h-40");
            icon.classList.add("rotate-180");
        }
    });
});
