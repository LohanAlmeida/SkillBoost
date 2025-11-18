// theme.js — alterna tema e salva em localStorage
(function(){
  const btn = document.getElementById('theme-toggle');
  // apply saved theme early
  const saved = localStorage.getItem('sb_theme');
  if(saved === 'dark') document.body.classList.add('dark');
  // set year placeholders
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
  document.getElementById('year2') && (document.getElementById('year2').textContent = new Date().getFullYear());
  document.getElementById('year3') && (document.getElementById('year3').textContent = new Date().getFullYear());

  if(btn){
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('sb_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
})();
