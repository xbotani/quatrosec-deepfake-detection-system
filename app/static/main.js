// app/static/main.js
/*────────────────── i18n translations ──────────────────*/
const translations = {
  en:{ app_name:"QuatroSec AI",page_title:"Deepfake Detection Portal",
       upload_title:"Upload Image",upload_placeholder:"Drag & Drop Image Here",
       analysis_title:"Analysis",preview_alt:"Preview",
       awaiting:"Awaiting image…",analyzing:"Analyzing…",
       error_analyze:"Error analyzing file.",
       footer:"© 2025 QuatroSec AI • Forensic‑grade Deepfake Detection",
       dark_light:"Dark Mode"},
  es:{ app_name:"QuatroSec AI",page_title:"Portal de Detección Deepfake",
       upload_title:"Subir Imagen",upload_placeholder:"Arrastra y suelta la imagen aquí",
       analysis_title:"Análisis",preview_alt:"Vista previa",
       awaiting:"Esperando imagen…",analyzing:"Analizando…",
       error_analyze:"Error al analizar el archivo.",
       footer:"© 2025 QuatroSec AI • Detección forense Deepfake",
       dark_light:"Modo Oscuro"},
  fr:{ app_name:"QuatroSec AI",page_title:"Portail de Détection Deepfake",
       upload_title:"Importer l’image",upload_placeholder:"Glissez‑déposez l’image ici",
       analysis_title:"Analyse",preview_alt:"Aperçu",
       awaiting:"En attente d’image…",analyzing:"Analyse en cours…",
       error_analyze:"Erreur d’analyse du fichier.",
       footer:"© 2025 QuatroSec AI • Détection Deepfake médico‑légale",
       dark_light:"Mode Sombre"},
  ar:{ app_name:"QuatroSec AI",page_title:"بوابة كشف التزييف العميق",
       upload_title:"رفع الصورة",upload_placeholder:"اسحب وأفلت الصورة هنا",
       analysis_title:"التحليل",preview_alt:"معاينة",
       awaiting:"في انتظار الصورة…",analyzing:"جاري التحليل…",
       error_analyze:"خطأ في تحليل الملف.",
       footer:"© 2025 QuatroSec AI • كشف التزييف العميق للطب الشرعي",
       dark_light:"الوضع الداكن"},
  ku:{ app_name:"QuatroSec AI",page_title:"دۆزینەوەی ساختەکاری زیرەکی دەستکرد",
       upload_title:"زیادکردنی وێنە",upload_placeholder:"وێنەکە لێرە دابنێ",
       analysis_title:"زانیاری",preview_alt:"پیشاندانی وێنە",
       awaiting:"چاوەڕێی وێنە…",analyzing:"لە ڕێگەی چارچوێن…",
       error_analyze:"هەڵە لە پێشبینی فایل.",
       footer:"© 2025 QuatroSec AI • دۆزینەوەی ساختەکاری یاسایی",
       dark_light:"دۆخی توری"}
};

const langSelect = document.getElementById('lang-select');
function t(key){
  const lang = langSelect?.value || 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}
function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el=>{
    const attr = el.getAttribute('data-i18n-attr');
    el.setAttribute(attr, t(el.getAttribute('data-i18n')));
  });
  if(dropPrompt) dropPrompt.textContent = t('upload_placeholder');
  if(awaitingEl) awaitingEl.textContent = t('awaiting');
  themeToggleBtn.setAttribute('aria-label', t('dark_light'));
}
langSelect.addEventListener('change', applyTranslations);

/*────────────────── Theme toggle (moon⇆sun) ────────────*/
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(mode) {
  const isLight = mode === 'light';
  
  // Toggle theme class first
  document.body.classList.toggle('light-theme', isLight);
  localStorage.setItem('theme', mode);
  
  // Set icon based on ACTUAL theme state
  themeIcon.className = isLight 
    ? 'fas fa-sun'  // Sun icon for light mode
    : 'fas fa-moon'; // Moon icon for dark mode

  // Verify in console
  console.log(`Theme: ${mode}, Icon: ${themeIcon.className}`);
}

// Initialize with proper icon
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  // Get current state BEFORE toggling
  const currentIsLight = document.body.classList.contains('light-theme');
  // Set OPPOSITE theme
  setTheme(currentIsLight ? 'dark' : 'light');
});

/*────────────────── Global progress bar ────────────────*/
const progressBar = document.getElementById('progress-bar');
function startProgress(){
  progressBar.style.width='0%'; 
  void progressBar.offsetWidth;
  progressBar.style.width='80%';
}

function finishProgress(){
  progressBar.style.width='100%';
  setTimeout(() => progressBar.style.width = '0%', 300);
}

/*────────────────── Ripple effect ──────────────────────*/
const drop = document.getElementById('drop');
drop.addEventListener('click', e => {
  const circle = document.createElement('span');
  circle.className = 'ripple';
  drop.appendChild(circle);
  
  const d = Math.max(drop.clientWidth, drop.clientHeight);
  circle.style.width = circle.style.height = `${d}px`;
  circle.style.left = `${e.clientX - drop.offsetLeft - d/2}px`;
  circle.style.top = `${e.clientY - drop.offsetTop - d/2}px`;
  
  setTimeout(() => circle.remove(), 600);
});

/*────────────────── Tooltip text map ───────────────────*/
const tooltips = {
  Overall: 'Final confidence of real vs. fake.',
  'Likely AI‑generated': 'Probability image was generated by AI.',
  GenAI: 'General AI model probability.',
  Diffusion: 'Diffusion‑model probability.',
  GAN: 'GAN‑model probability.'
};

/*────────────────── Drag & Drop logic ──────────────────*/
const preview = document.getElementById('preview');
const results = document.getElementById('results');
let dropPrompt, awaitingEl;

drop.ondragover = e => {
  e.preventDefault();
  drop.classList.add('active');
};

drop.ondragleave = () => drop.classList.remove('active');

async function detect(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/predict', { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

drop.ondrop = async e => {
  e.preventDefault();
  drop.classList.remove('active');

  const file = e.dataTransfer.files[0];
  preview.src = URL.createObjectURL(file);

  results.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-bar';
    results.appendChild(sk);
  }

  startProgress();

  try {
    const data = await detect(file);
    finishProgress();

    results.innerHTML = '';
    Object.entries(data).forEach(([category, metrics]) => {
      const section = document.createElement('div');
      section.className = 'metrics-section';

      // Updated icon classes to Font Awesome 6 syntax
      const iconMap = {
        Overall: 'fas fa-shield-halved',
        Diffusion: 'fas fa-water',
        GAN: 'fas fa-mask',
        GenAI: 'fas fa-robot'
      };

      const h2 = document.createElement('h2');
      h2.innerHTML = `<i class="${iconMap[category] || 'fas fa-chart-simple'}"></i> ${category}`;
      if (category === 'Overall') h2.style.fontSize = '1.1rem';
      section.appendChild(h2);

      const ul = document.createElement('ul');
      ul.className = 'metrics-list';

      Object.entries(metrics).forEach(([label, value]) => {
        const li = document.createElement('li');
        li.title = tooltips[label] || '';
        li.innerHTML = `
          <span class="label">${label}</span>
          <div class="bar"><div class="fill" style="width:${value};"></div></div>
          <span class="value">${value}</span>`;
        ul.appendChild(li);
      });

      section.appendChild(ul);
      results.appendChild(section);
    });

    dropPrompt = drop.querySelector('p[data-i18n="upload_placeholder"]');
    awaitingEl = results.querySelector('.placeholder[data-i18n="awaiting"]');
    applyTranslations();

  } catch (err) {
    finishProgress();
    console.error(err);
    // Updated error icon to Font Awesome 6 syntax
    results.innerHTML = `<p class="placeholder error">
        <i class="fas fa-times-circle"></i> ${t('error_analyze')}
      </p>`;
  }
};

/*────────────────── Initialization ─────────────────────*/
window.addEventListener('DOMContentLoaded', () => {
  dropPrompt = drop.querySelector('p[data-i18n="upload_placeholder"]');
  awaitingEl = results.querySelector('.placeholder[data-i18n="awaiting"]');
  applyTranslations();
  
  // Font Awesome fallback check
  if(!window.FontAwesome){
    console.warn('Font Awesome not loaded! Using text fallback');
    themeIcon.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
  }
});