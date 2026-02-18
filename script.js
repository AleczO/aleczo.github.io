const toggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;


const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
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