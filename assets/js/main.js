// Theme Toggle
const themeBtn = document.getElementById('themeToken');
const htmlEl = document.documentElement;
const icon = themeBtn.querySelector('i');

// Check local storage or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

themeBtn.addEventListener('click', () => {
  const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateIcon(newTheme);
});

function updateIcon(theme) {
  if (theme === 'dark') {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  } else {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
}

// Email Copy
const copyBtn = document.getElementById('copyBtn');
const emailInput = document.getElementById('email-address');

copyBtn.addEventListener('click', () => {
  // Select text
  emailInput.select();
  emailInput.setSelectionRange(0, 99999); // Mobile compatibility

  // Copy
  navigator.clipboard.writeText(emailInput.value).then(() => {
    const originalText = copyBtn.textContent;
    // Check current language to set correct success message
    const currentLang = document.documentElement.lang;
    copyBtn.textContent = currentLang === 'tr' ? 'Kopyalandı!' : 'Copied!';
    copyBtn.style.background = '#10b981'; // Success green

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Kopyalama başarısız:', err);
  });
});

// Localization / Translations
const translations = {
  tr: {
    nav_about: "Hakkında",
    nav_projects: "Projeler",
    nav_community: "Topluluk",
    nav_contact: "İletişim",
    location: "Samsun, Türkiye",
    hero_title: 'Network & Wireless <br> <span class="highlight">Engineering</span>',
    hero_bio: "SOC L1 Cybersecurity Professional. Enterprise networking ve wireless teknolojilerde odaklıyım. Güvenli ve sürdürülebilir ağlar tasarlar, izleme/konfigürasyon işlerini otomasyonla sadeleştiririm.",
    projects_title: "Öne Çıkan Projeler",
    proj_ccna_desc: "Yapılandırma dosyaları, rehberler ve otomasyon scriptleri içeren Cisco CCNA laboratuvarları.",
    proj_ccnp_desc: "Yapılandırma dosyaları, rehberler ve otomasyon scriptleri içeren CCNP notları ve laboratuvarları.",
    proj_go_desc: "Go ile Ağ Programlama + güvenilir kaynaklardan pratik örnekler: soketler, HTTP, vb.",
    proj_tolerex_desc: "Hata toleranslı dağıtık mesaj depolama; lider tabanlı replikasyon, gRPC.",
    proj_ansible_desc: "Nokia SR Linux için Ansible + Containerlab ile modern model-driven spine–leaf laboratuvarı.",
    proj_nexus_desc: "Go ile Production-grade Microservices Hub: Docker Swarm, RabbitMQ, gRPC, Caddy.",
    view_repo: "Repo'yu İncele",
    community_desc: "\"Herkes İçin Netreka!\" sloganıyla teknoloji eğitimleri.",
    last_video: "Son Video:",
    join_linkedin: "LinkedIn Grubuna Katıl",
    contact_title: "Birlikte Çalışalım",
    service_lab: "Lab Kurulum",
    service_group: "Çalışma Grubu",
    btn_copy: "Kopyala"
  },
  en: {
    nav_about: "About",
    nav_projects: "Projects",
    nav_community: "Community",
    nav_contact: "Contact",
    location: "Samsun, Turkey",
    hero_title: 'Network & Wireless <br> <span class="highlight">Engineering</span>',
    hero_bio: "SOC L1 Cybersecurity Professional. Focused on enterprise networking and wireless technologies. I design secure and sustainable networks and simplify monitoring/configuration via automation.",
    projects_title: "Featured Projects",
    proj_ccna_desc: "Cisco CCNA networking labs with configuration files, guides, and automation scripts.",
    proj_ccnp_desc: "CCNP networking notes and labs with configuration files, guides, and automation scripts.",
    proj_go_desc: "Network Programming with Go + practical examples from reliable sources: sockets, HTTP, etc.",
    proj_tolerex_desc: "Fault-tolerant distributed message storage; leader-based replication, gRPC, configurable consistency.",
    proj_ansible_desc: "Modern model-driven spine–leaf lab with Ansible + Containerlab for Nokia SR Linux.",
    proj_nexus_desc: "Production-grade Microservices Hub in Go: Docker Swarm, RabbitMQ, gRPC, Caddy, Postgres + Mongo.",
    view_repo: "View Repo",
    community_desc: "Tech education with the slogan \"Netreka for Everyone!\"",
    last_video: "Latest Video:",
    join_linkedin: "Join LinkedIn Group",
    contact_title: "Let's Work Together",
    service_lab: "Lab Setup",
    service_group: "Study Group",
    btn_copy: "Copy Email"
  }
};

const langToggle = document.getElementById('langToggle');

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'tr' ? 'en' : 'tr';

    // Update HTML lang attribute
    document.documentElement.lang = newLang;

    // Update Toggle Button Text
    langToggle.textContent = newLang === 'tr' ? 'EN' : 'TR';

    // Update All Elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[newLang][key]) {
        // Use innerHTML for keys that might contain HTML (like hero_title)
        if (key === 'hero_title' || key === 'hero_bio') {
          el.innerHTML = translations[newLang][key];
        } else {
          el.textContent = translations[newLang][key];
        }
      }
    });
  });
}

console.log("Portfolio ready. 🚀");
