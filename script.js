const toggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;


const savedTheme = localStorage.getItem('theme');

if (savedTheme !== 'light') {
    htmlElement.setAttribute('data-theme', 'dark');
}


if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            // Przełącz na jasny
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            // Przełącz na ciemny
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Przełącznik języka (strony z blokami data-lang="pl" / data-lang="en")
const langBtn = document.getElementById('lang-toggle');

if (langBtn) {
    const applyLang = (lang) => {
        htmlElement.lang = lang;
        langBtn.textContent = lang === 'pl' ? 'EN' : 'PL';
        const title = htmlElement.dataset[lang === 'pl' ? 'titlePl' : 'titleEn'];
        if (title) document.title = title;
        document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
    };

    const savedLang = localStorage.getItem('lang');
    applyLang(savedLang || (navigator.language.startsWith('pl') ? 'pl' : 'en'));

    langBtn.addEventListener('click', () => {
        const next = htmlElement.lang === 'pl' ? 'en' : 'pl';
        localStorage.setItem('lang', next);
        applyLang(next);
    });
}
