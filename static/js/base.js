const root = document.documentElement;
        const toggleBtn = document.getElementById('theme-toggle');
        const saved = localStorage.getItem('razor-theme');

        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        }

        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('[data-nav]').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        document.querySelectorAll('[data-side]').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('[data-side]').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });