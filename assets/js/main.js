const htmlEl = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getPerformanceProfile() {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("lite") === "1" || params.get("performance") === "lite"
        ? "lite"
        : params.get("lite") === "0" || params.get("performance") === "full"
            ? "full"
            : "";
    let storedMode = "";
    try {
        if (requestedMode) {
            localStorage.setItem("performance-mode", requestedMode);
        }
        storedMode = localStorage.getItem("performance-mode") || "";
    } catch {
        storedMode = "";
    }

    const viewportWidth = window.innerWidth || htmlEl.clientWidth || 1024;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || "";
    const slowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
    const saveData = Boolean(connection?.saveData);
    const deviceMemory = Number(navigator.deviceMemory || 0);
    const cpuCores = Number(navigator.hardwareConcurrency || 0);
    const narrowViewport = window.matchMedia("(max-width: 900px)").matches;
    const compactViewport = window.matchMedia("(max-width: 520px)").matches;
    const lowMemory = deviceMemory > 0 && deviceMemory <= 2;
    const lowCpu = cpuCores > 0 && cpuCores <= 4;
    const limitedDevice = lowMemory || lowCpu || slowConnection || saveData || prefersReducedMotion.matches;
    const autoLowPower = narrowViewport || limitedDevice;
    const lowPower = storedMode === "lite" ? true : storedMode === "full" ? false : autoLowPower;

    return {
        tier: lowPower ? "lite" : "full",
        mode: storedMode || "auto",
        lowPower,
        mobile: narrowViewport,
        compact: compactViewport,
        viewportWidth,
        slowConnection,
        saveData,
        lowMemory,
        lowCpu
    };
}

const performanceProfile = getPerformanceProfile();
htmlEl.dataset.deviceTier = performanceProfile.tier;
htmlEl.dataset.lowPower = performanceProfile.lowPower ? "1" : "0";
htmlEl.dataset.mobileLite = performanceProfile.mobile ? "1" : "0";
window.PortfolioPerformance = Object.freeze(performanceProfile);
const themeBtn = document.getElementById("themeToken");
const langToggle = document.getElementById("langToggle");
const copyBtn = document.getElementById("copyBtn");
const emailInput = document.getElementById("email-address");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const timeTheme = window.TimeTheme;

const THEME_MODE_LABEL_KEYS = Object.freeze({
    auto: "theme_mode_auto",
    dawn: "theme_mode_dawn",
    day: "theme_mode_day",
    sunset: "theme_mode_sunset",
    night: "theme_mode_night"
});

let themeRefreshTimer = null;
let themeState = {
    mode: "auto",
    resolvedTheme: "night",
    surfaceTheme: "dark",
    currentTheme: { label: "Otomatik", icon: "◐" },
    resolvedThemeMeta: { label: "Gece", icon: "☾" }
};

const CONTACT_LIMIT_KEY = "contactSubmitHistory";
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MIN_GAP_MS = 60 * 1000;
const CONTACT_MAX_IN_WINDOW = 3;

const translations = {
    tr: {
        nav_about: "Hakkında",
        nav_projects: "Projeler",
        nav_community: "Topluluk",
        nav_mission: "Yaşam Amacı",
        nav_notes: "Notlar",
        nav_library: "Kütüphane",
        nav_contact: "İletişim",
        location: "Samsun, Türkiye",
        hero_kicker: "Yasin Engin · Ağ Otomasyonu & SDN Odaklı Bilgisayar Mühendisliği Öğrencisi",
        hero_title: 'SDN ve Ağ Otomasyonu + <br> <span class="highlight">Go Backend + Dağıtık Sistemler</span>',
        hero_bio: "Ağ otomasyonu ve SDN odaklı Bilgisayar Mühendisliği öğrencisi olarak dağıtık sistemler odağında Go ve gRPC kullanarak üretim kalitesinde araçlar geliştiriyorum.",
        hero_proof: "Mühendislik notları, vaka incelemeleri ve uygulamalı laboratuvar çalışmalarıyla (30+ laboratuvar, 12+ otomasyon servisi, 5+ açık kaynaklı proje) SDN ve Go üzerine düzenli içerik üretiyorum.",
        hero_cv_view: "CV",
        hero_cv_pdf: "PDF CV",
        hero_case_studies: "Vaka İncelemeleri",
        hero_notes: "Mühendislik Notları",
        hero_panel_label: "Çalışma Ekseni",
        hero_panel_title: "Üret, otomatikleştir, paylaş",
        hero_panel_summary: "Üretim kalitesi backend, SDN laboratuvarları ve teknik notları tek bir ritimde birleştiren çalışma akışı.",
        hero_focus_backend_title: "Backend sistemler",
        hero_focus_backend_desc: "Go, gRPC ve servis mimarisi",
        hero_focus_automation_title: "Ağ otomasyonu",
        hero_focus_automation_desc: "SDN, lab tasarımı ve programlanabilirlik",
        hero_focus_notes_title: "Teknik anlatım",
        hero_focus_notes_desc: "Notlar, vaka analizleri ve rehberler",
        hero_dock_about: "Kimim ve çalışma eksenim",
        hero_dock_projects: "Repo ve vakalar",
        hero_dock_community: "Netreka merkezi",
        hero_dock_mission: "Temel ilkelerim",
        hero_dock_notes: "Mühendislik yazıları",
        hero_dock_library: "Kitap ve makaleler",
        hero_dock_contact: "Mesaj ve iş birliği",
        nav_youtube: "YouTube",
        hero_dock_youtube: "Netreka Akademi",
        youtube_title: "YouTube / Netreka Akademi",
        youtube_lead: "\"Herkes İçin Netreka!\" sloganıyla ağ otomasyonu, SDN, CCNA ve CCNP konularında Türkçe video eğitimler.",
        theme_mode_auto: "Otomatik",
        theme_mode_dawn: "Sabah",
        theme_mode_day: "Gündüz",
        theme_mode_sunset: "Gün Batımı",
        theme_mode_night: "Gece",
        theme_button_label: "Tema değiştir. Şu an: {mode}",
        theme_button_title: "Tema: {mode} / Aktif renk: {resolved}",
        theme_button_announce: "Tema modu: {mode}. Aktif görünüm: {resolved}.",
        lang_button_label: "Dili değiştir. Sonraki: {language}",
        language_turkish: "Türkçe",
        language_english: "İngilizce",
        mission_kicker: "Yaşam Amacı",
        mission_title: "Bilgi, şefkat ve eylem etrafında şekillenen bir yaşam yönü",
        mission_lead: "Nasıl öğrenmek, üretmek, öğretmek ve topluma katkı sunmak istediğimi belirleyen ilke bu.",
        mission_quote: "I want to devote myself to uplifting humanity through knowledge (education, science, and lifelong learning), compassion (dialogue, empathy, and altruism), and action (positive service and contribution to society).",
        mission_translation: "Eğitim, bilim, empati, hizmet ve anlamlı toplumsal katkı etrafında kurulan uzun vadeli bir yaşam amacı.",
        mission_knowledge_title: "Bilgi",
        mission_knowledge_desc: "Eğitimi, bilimi ve yaşam boyu öğrenmeyi destekleyerek bilginin paylaşılan bir kamusal güce dönüşmesini savunmak.",
        mission_compassion_title: "Şefkat",
        mission_compassion_desc: "Diyalog, empati ve özgecilik için alan açarak insanların görüldüğünü, saygı duyulduğunu ve desteklendiğini hissettirmek.",
        mission_action_title: "Eylem",
        mission_action_desc: "Değerleri, toplumu gerçek anlamda güçlendiren olumlu hizmete ve somut katkıya dönüştürmek.",
        projects_title: "Öne Çıkan Projeler",
        notes_title: "Yasin Engin'den Son Notlar",
        notes_lead: "Ağ otomasyonu, gRPC API tasarımı, olay müdahalesi ve üretim kontrol listeleri üzerine teknik notlar.",
        library_title: "Kütüphane / Akademik Okumalar",
        library_lead: "SDN, ağ otomasyonu, dağıtık sistemler, information-centric networking (ICN), content-centric networking (CCN), named data networking (NDN), clean-slate networking, CDN/NDN karşılaştırmaları ve ağ programlanabilirliği üzerine akademik okumalar ve referanslar.",
        resource_buy: "Satın alma sayfası",
        resource_paper: "Orijinal makale",
        resource_bibliography: "Bibliyografik kayıt",
        paper_named_content_note: "İsimlendirilmiş veriyi, isimlendirilmiş ana makinelerin yerine koyarak içerik erişilebilirliğini, güvenliği ve iletim verimliliğini geliştirmeyi öneren temel CCN çalışması.",
        paper_ndnsim_note: "NDN mimarisini NS-3 üzerinde modüler biçimde deneyebilmek için paket iletimi, yönlendirme, önbellekleme ve uygulama davranışlarını simüle eden temel çalışma.",
        book_ccna_note: "Ağ temelleri, IP yönlendirme, anahtarlama ve güvenlik kavramlarına dair kapsamlı CCNA çalışma rehberi.",
        book_ccnp_note: "Kurumsal ağ mimarileri, sanallaştırma, otomasyon ve güvenlik konularında derinlemesine CCNP referansı.",
        book_yang_note: "Ağ cihazlarını yönetmek için NETCONF/RESTCONF protokolleri ve YANG veri modelleme dilini anlatan temel eser.",
        book_go_note: "Modern ağ mühendisliği için Go programlama dili ile otomasyon, test ve entegrasyon uygulamaları.",
        paper_ndn_note: "Bulut-uç bilişim sürekliliğinde servis kalitesini sağlamak için NDN mimarisi üzerinden uçtan uca kaynak rezervasyon mekanizmaları.",
        paper_nlsr_note: "NDN üzerinde çalışan NLSR'nin ad öneki erişilebilirliği, Interest/Data tabanlı yönlendirme güncellemeleri, güven modeli ve çok yollu iletim seçenekleri üzerine temel çalışma.",
        paper_twenty_years_icn_note: "ICN literatürünün yaklaşık yirmi yıllık birikimini, CDN bağımlılığına alternatif olarak içerik adlandırma, ağ-içi önbellekleme ve gelecekteki İnternet mimarisi açısından değerlendiren çalışma.",
        paper_cdn_ndn_note: "CDN ve NDN'i dağıtım verimliliği, protokol yükü, güvenlik, dayanıklılık, maliyet ve test ortamı performansı açısından karşılaştıran IEEE SMC çalışması.",
        paper_icn_note: "Information-Centric Networking (ICN) alanındaki temel araştırmaları, mimari önerileri ve tasarım zorluklarını inceleyen kapsamlı anket çalışması.",
        paper_clean_slate_note: "Mevcut İnternet mimarisinin güvenlik, mobilite, ölçeklenebilirlik, QoS ve operasyonel karmaşıklık sorunlarını clean-slate tasarım perspektifiyle tartışan erken CCR makalesi.",
        paper_future_architecture_note: "Geleceğin İnternet mimarisi için kökten yeniden tasarım ile evrimsel araştırma arasındaki gerilimi, deneysel dağıtım ve araştırma disiplini bağlamında tartışan CACM yazısı.",
        skill_networking: "Ağ Teknolojileri",
        skill_programmability: "SDN & Programlanabilirlik",
        skill_sre_devops: "SRE & DevOps",
        skill_automation: "Otomasyon",
        proj_nexus_desc: "Broker mimarisi, RabbitMQ tabanlı olay akışları, gRPC loglama, Docker Swarm ve Caddy ağ geçidi.",
        proj_tolerex_desc: "Lider-üye yapısı, mTLS gRPC, heartbeat tabanlı hata tespiti, disk kalıcılığı ve kapsamlı metrikleme.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab ve gNMI tabanlı otomasyon iş akışları.",
        proj_go_desc: "Go ile ağ protokolleri, soketler ve HTTP sunucuları üzerine uygulamalar.",
        proj_restapi_desc: "Temiz yönlendirme, doğrulama ve JSON yanıtlarıyla REST API tabanlı backend servis.",
        proj_cisco_desc: "Cisco sertifikaları için kapsamlı çalışma notları, laboratuvar yapılandırmaları ve otomasyon betikleri.",
        view_repo: "Depoyu İncele",
        read_note: "Notu Oku",
        community_desc: "\"Herkes İçin Netreka!\" sloganıyla teknoloji eğitimleri.",
        community_chip_focus: "Ağ Otomasyonu ve SDN",
        last_video: "Son Video:",
        join_linkedin: "LinkedIn Grubuna Katıl",
        community_hub_open: "Topluluk Merkezi",
        community_hub_ideas: "Fikir Gönder",
        community_hub_showcase: "Proje Vitrini",
        contact_title: "Birlikte Çalışalım",
        service_lab: "Lab Kurulumu",
        service_automation: "Ağ Otomasyonu",
        service_group: "Çalışma Grubu",
        btn_copy: "Kopyala",
        form_name: "Ad Soyad",
        form_email: "E-posta",
        form_message: "Mesaj",
        contact_submit: "Mesaj Gönder",
        contact_sending: "Gönderiliyor...",
        contact_success: "Mesaj başarıyla gönderildi.",
        contact_error: "Mesaj gönderilemedi. Lütfen tekrar deneyin veya e-posta adresini kopyalayın.",
        contact_spam: "Spam filtresi bu gönderimi engelledi.",
        contact_required: "Lütfen tüm alanları doldurun.",
        contact_rate_limit_window: "Son bir saat içinde çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.",
        contact_rate_limit_gap: "Yeni bir mesaj göndermeden önce {seconds} saniye bekleyin.",
        copy_success: "Kopyalandı!",
        email_copied: "E-posta kopyalandı.",
        copy_error: "Kopyalama başarısız oldu. E-posta adresini elle seçebilirsiniz.",
        focus_mode_enabled: "Odak modu açıldı.",
        focus_mode_disabled: "Odak modu kapandı.",
        cmdk_placeholder: "Yaz: github / vaka incelemeleri / cv / projeler",
        cmdk_hint: "Açmak için Enter | Kapatmak için Esc | Geçiş için Ctrl+K",
        cmdk_empty: "Eşleşen komut yok.",
        cmdk_desc_github: "Kod depolarını aç",
        cmdk_desc_linkedin: "Profesyonel profile git",
        cmdk_desc_projects: "Öne çıkan repolara atla",
        cmdk_desc_notes: "Mühendislik notlarını aç",
        cmdk_desc_case_studies: "Vaka incelemelerine git",
        cmdk_desc_cv: "CV sayfasını aç",
        cmdk_desc_cv_pdf: "PDF CV dosyasını aç",
        cmdk_desc_library: "Kitap ve makale listesine atla",
        cmdk_desc_youtube: "Netreka Akademi kanalına git",
        cmdk_desc_contact: "İletişim alanına atla",
        cmdk_action_theme: "Tema değiştir",
        cmdk_desc_theme: "Zaman bazlı tema modunu döndür",
        cmdk_action_language_tr: "Türkçe yap",
        cmdk_action_language_en: "İngilizce yap",
        cmdk_desc_language: "Arayüz dilini değiştir",
        cmdk_action_focus: "Odak modu",
        cmdk_desc_focus: "Arka plan hareketini sadeleştir",
        cmdk_action_vcard: "vCard indir",
        cmdk_desc_vcard: "Kişi kartı oluştur",
        cmdk_action_email: "E-postayı kopyala",
        cmdk_desc_email: "E-posta adresini panoya al",
        community_hero_title: "Topluluk Merkezi",
        community_hero_desc: "Birlikte üretelim, paylaşalım ve gelişelim.",
        community_ideas: "Fikirler",
        community_help: "Yardım",
        community_showcase: "Vitrin",
        section_ideas_title: "Proje Fikirleri",
        section_help_title: "Yardım Bekleyenler",
        section_showcase_title: "Proje Vitrini",
        footer_social_kicker: "Dijital Duraklar",
        footer_social_lead: "Kod, kariyer, video, görsel akış ve kitaplara tek bir küçük iskeleden ulaş.",
        social_hint_github: "Kod ve depolar",
        social_hint_linkedin: "Profesyonel profil ve ağ",
        social_hint_instagram: "Görsel paylaşımlar ve günlük akış",
        social_hint_youtube: "Videolar, laboratuvarlar ve dersler",
        social_hint_1000kitap: "Kitaplar, okuma izi ve notlar"
    },
    en: {
        nav_about: "About",
        nav_projects: "Projects",
        nav_community: "Community",
        nav_mission: "Mission",
        nav_notes: "Notes",
        nav_library: "Library",
        nav_contact: "Contact",
        location: "Samsun, Turkey",
        hero_kicker: "Yasin Engin · Network Automation & SDN-Focused Computer Engineering Student",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Computer Engineering student focused on Software Defined Networking (SDN), Network Automation, and Distributed Systems, building production-grade tools with Go and Python.",
        hero_proof: "Regularly publishing engineering notes, case studies, and hands-on labs (30+ topologies, 12+ automation scripts, 5+ open-source projects) about SDN, Go, and distributed systems.",
        hero_cv_view: "View CV",
        hero_cv_pdf: "PDF CV",
        hero_case_studies: "Case Studies",
        hero_notes: "Engineering Notes",
        hero_panel_label: "Work Axis",
        hero_panel_title: "Build, automate, share",
        hero_panel_summary: "A working rhythm that connects production-grade backend systems, SDN labs, and technical writing.",
        hero_focus_backend_title: "Backend systems",
        hero_focus_backend_desc: "Go, gRPC, and service architecture",
        hero_focus_automation_title: "Network automation",
        hero_focus_automation_desc: "SDN, lab design, and programmability",
        hero_focus_notes_title: "Technical writing",
        hero_focus_notes_desc: "Notes, case studies, and guides",
        hero_dock_about: "Who I am and how I work",
        hero_dock_projects: "Repos and case studies",
        hero_dock_community: "Community space",
        hero_dock_mission: "Core principles",
        hero_dock_notes: "Engineering writing",
        hero_dock_library: "Books and papers",
        hero_dock_contact: "Contact and collaboration",
        nav_youtube: "YouTube",
        hero_dock_youtube: "Netreka Academy",
        youtube_title: "YouTube / Netreka Academy",
        youtube_lead: "Turkish-language video tutorials on network automation, SDN, CCNA, and CCNP topics under the motto \"Netreka for Everyone!\"",
        theme_mode_auto: "Automatic",
        theme_mode_dawn: "Dawn",
        theme_mode_day: "Day",
        theme_mode_sunset: "Sunset",
        theme_mode_night: "Night",
        theme_button_label: "Change theme. Current mode: {mode}",
        theme_button_title: "Theme: {mode} / Active palette: {resolved}",
        theme_button_announce: "Theme mode: {mode}. Active palette: {resolved}.",
        lang_button_label: "Change language. Next: {language}",
        language_turkish: "Turkish",
        language_english: "English",
        mission_kicker: "Core Mission",
        mission_title: "A life direction anchored in knowledge, compassion, and action",
        mission_lead: "This is the principle that guides how I want to learn, build, teach, and contribute.",
        mission_quote: "I want to devote myself to uplifting humanity through knowledge (education, science, and lifelong learning), compassion (dialogue, empathy, and altruism), and action (positive service and contribution to society).",
        mission_translation: "A long-term purpose centered on education, science, empathy, service, and meaningful contribution.",
        mission_knowledge_title: "Knowledge",
        mission_knowledge_desc: "Champion education, science, and lifelong learning so insight can become a shared public good.",
        mission_compassion_title: "Compassion",
        mission_compassion_desc: "Create room for dialogue, empathy, and altruism so people feel seen, respected, and supported.",
        mission_action_title: "Action",
        mission_action_desc: "Turn values into positive service and practical contribution that strengthens society in real ways.",
        projects_title: "Featured Projects",
        notes_title: "Latest Notes by Yasin Engin",
        notes_lead: "Technical writing on network automation, gRPC API design, incident response, and practical production checklists.",
        library_title: "Library / Academic Reading",
        library_lead: "Academic reading and reference material on SDN, network automation, distributed systems, information-centric networking (ICN), content-centric networking (CCN), named data networking (NDN), clean-slate networking, CDN/NDN comparisons, and network programmability.",
        resource_buy: "Purchase page",
        resource_paper: "Original paper",
        resource_bibliography: "Bibliographic record",
        paper_named_content_note: "A foundational CCN paper that proposes named data instead of named hosts to improve content availability, security, and delivery efficiency.",
        paper_ndnsim_note: "A foundational simulator paper for experimenting with NDN on NS-3, covering packet forwarding, routing, caching, and application behavior.",
        book_ccna_note: "A comprehensive CCNA study guide covering network fundamentals, IP routing, switching, and security concepts.",
        book_ccnp_note: "An in-depth CCNP reference on enterprise network architectures, virtualization, automation, and security.",
        book_yang_note: "A foundational book explaining NETCONF/RESTCONF protocols and the YANG data modeling language for network device management.",
        book_go_note: "Practical applications of the Go programming language for automation, testing, and integration in modern network engineering.",
        paper_ndn_note: "End-to-end resource reservation mechanisms over the NDN architecture to ensure QoS in the cloud-edge computing continuum.",
        paper_nlsr_note: "A foundational paper on NLSR over NDN, covering name-prefix reachability, Interest/Data-based routing updates, trust modeling, and multipath forwarding options.",
        paper_twenty_years_icn_note: "A review of roughly two decades of ICN research, evaluating content naming, in-network caching, and future Internet architecture as an alternative to CDN dependence.",
        paper_cdn_ndn_note: "An IEEE SMC study comparing CDN and NDN through delivery efficiency, protocol overhead, security, resilience, cost, and testbed performance.",
        paper_icn_note: "A comprehensive survey exploring fundamental research, architectural proposals, and design challenges in Information-Centric Networking (ICN).",
        paper_clean_slate_note: "An early CCR article discussing Internet security, mobility, scalability, QoS, and operational complexity through a clean-slate architecture lens.",
        paper_future_architecture_note: "A CACM viewpoint on the tension between clean-slate redesign and evolutionary research for future Internet architecture, grounded in deployment and research discipline.",
        skill_networking: "Networking",
        skill_programmability: "SDN & Programmability",
        skill_sre_devops: "SRE & DevOps",
        skill_automation: "Automation",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Leader-member, mTLS gRPC, heartbeat failure detection, disk persistence, metrics/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab, and gNMI based automation workflows.",
        proj_go_desc: "Implementation of network protocols, sockets, and HTTP servers using Go.",
        proj_restapi_desc: "REST API backend service with clean routing, validation, and JSON responses.",
        proj_cisco_desc: "Comprehensive study notes, lab configurations, and automation scripts for Cisco certifications.",
        view_repo: "View Repo",
        read_note: "Read Note",
        community_desc: "Tech education with the slogan \"Netreka for Everyone!\"",
        community_chip_focus: "Network Automation & SDN",
        last_video: "Latest Video:",
        join_linkedin: "Join LinkedIn Group",
        community_hub_open: "Community Hub",
        community_hub_ideas: "Submit Idea",
        community_hub_showcase: "Project Showcase",
        contact_title: "Let's Work Together",
        service_lab: "Lab Setup",
        service_automation: "Network Automation",
        service_group: "Study Group",
        btn_copy: "Copy Email",
        form_name: "Name",
        form_email: "Email",
        form_message: "Message",
        contact_submit: "Send Message",
        contact_sending: "Sending...",
        contact_success: "Message sent successfully.",
        contact_error: "Message could not be sent. Please retry or use email copy.",
        contact_spam: "Spam filter blocked this submission.",
        contact_required: "Please fill in all fields.",
        contact_rate_limit_window: "Too many messages in the last hour. Please try later.",
        contact_rate_limit_gap: "Please wait {seconds}s before sending another message.",
        copy_success: "Copied!",
        email_copied: "Email copied.",
        copy_error: "Copy failed. You can select the email address manually.",
        focus_mode_enabled: "Focus mode enabled.",
        focus_mode_disabled: "Focus mode disabled.",
        cmdk_placeholder: "Type: github / case studies / cv / projects",
        cmdk_hint: "Enter to open | Esc to close | Ctrl+K to toggle",
        cmdk_empty: "No matching command.",
        cmdk_desc_github: "Open code repositories",
        cmdk_desc_linkedin: "Open professional profile",
        cmdk_desc_projects: "Jump to featured repos",
        cmdk_desc_notes: "Open engineering notes",
        cmdk_desc_case_studies: "Go to case studies",
        cmdk_desc_cv: "Open the CV page",
        cmdk_desc_cv_pdf: "Open the PDF CV",
        cmdk_desc_library: "Jump to books and papers",
        cmdk_desc_youtube: "Open Netreka Academy",
        cmdk_desc_contact: "Jump to contact",
        cmdk_action_theme: "Change theme",
        cmdk_desc_theme: "Cycle the time-aware theme mode",
        cmdk_action_language_tr: "Switch to Turkish",
        cmdk_action_language_en: "Switch to English",
        cmdk_desc_language: "Change interface language",
        cmdk_action_focus: "Focus mode",
        cmdk_desc_focus: "Simplify background motion",
        cmdk_action_vcard: "Download vCard",
        cmdk_desc_vcard: "Create a contact card",
        cmdk_action_email: "Copy email",
        cmdk_desc_email: "Copy email address to clipboard",
        community_hero_title: "Community Hub",
        community_hero_desc: "Let's create, share, and grow together.",
        community_ideas: "Ideas",
        community_help: "Help",
        community_showcase: "Showcase",
        section_ideas_title: "Project Ideas",
        section_help_title: "Help Wanted",
        section_showcase_title: "Project Showcase",
        footer_social_kicker: "Digital Touchpoints",
        footer_social_lead: "Code, career, video, stories, and books. Reach every platform from one small dock.",
        social_hint_github: "Code and repositories",
        social_hint_linkedin: "Professional profile and network",
        social_hint_instagram: "Visual snapshots and daily flow",
        social_hint_youtube: "Videos, labs, and lessons",
        social_hint_1000kitap: "Books, reading trail, and notes"
    }
};

function getCurrentLanguage() {
    return document.documentElement.lang === "tr" ? "tr" : "en";
}

function getUiText(key, fallback = "", replacements = {}) {
    const lang = getCurrentLanguage();
    let text = translations[lang]?.[key] || translations.en?.[key] || fallback;

    Object.entries(replacements).forEach(([token, value]) => {
        text = text.replaceAll(`{${token}}`, String(value));
    });

    return text;
}

function runViewTransition(update, transitionType = "ui") {
    if (typeof update !== "function") return undefined;

    if (!document.startViewTransition || prefersReducedMotion.matches) {
        return update();
    }

    htmlEl.dataset.transition = transitionType;
    const transition = document.startViewTransition(() => {
        update();
    });

    transition.finished.finally(() => {
        delete htmlEl.dataset.transition;
    });

    return transition;
}

function getThemeState(mode = "auto") {
    if (timeTheme?.getThemeState) {
        return timeTheme.getThemeState(mode);
    }

    const normalizedMode = THEME_MODE_LABEL_KEYS[mode] ? mode : "auto";
    const resolvedTheme = normalizedMode === "auto" ? "night" : normalizedMode;

    return {
        mode: normalizedMode,
        resolvedTheme,
        surfaceTheme: resolvedTheme === "day" ? "light" : "dark",
        currentTheme: { label: normalizedMode, icon: "◐" },
        resolvedThemeMeta: { label: resolvedTheme, icon: "☾" }
    };
}

function getThemeModeLabel(mode) {
    const key = THEME_MODE_LABEL_KEYS[mode];
    return key ? getUiText(key, mode) : mode;
}

function updateThemeButton() {
    if (!themeBtn) return;

    const glyph = themeBtn.querySelector(".theme-mode-glyph");
    const currentLabel = getThemeModeLabel(themeState.mode);
    const resolvedLabel = getThemeModeLabel(themeState.resolvedTheme);

    if (glyph) {
        glyph.textContent = themeState.currentTheme?.icon || "◐";
    }

    themeBtn.setAttribute("aria-label", getUiText("theme_button_label", `Change theme. Current mode: ${currentLabel}`, { mode: currentLabel }));
    themeBtn.setAttribute("title", getUiText("theme_button_title", `Theme: ${currentLabel} / Active palette: ${resolvedLabel}`, {
        mode: currentLabel,
        resolved: resolvedLabel
    }));
    themeBtn.dataset.themeMode = themeState.mode;
    themeBtn.dataset.resolvedTheme = themeState.resolvedTheme;
}

function updateThemeMeta(resolvedTheme, surfaceTheme) {
    if (!themeColorMeta) return;

    const themeColors = {
        dawn: "#102536",
        day: "#1a3f5f",
        sunset: "#331c30",
        night: "#04070f"
    };

    themeColorMeta.setAttribute("content", themeColors[resolvedTheme] || (surfaceTheme === "light" ? "#efe9dc" : "#04070f"));
}

let appStatusRegion = null;
let appStatusTimer = null;

function getAppStatusRegion() {
    if (appStatusRegion?.isConnected) return appStatusRegion;

    appStatusRegion = document.getElementById("app-status-region");

    if (!appStatusRegion) {
        appStatusRegion = document.createElement("p");
        appStatusRegion.id = "app-status-region";
        appStatusRegion.className = "visually-hidden";
        appStatusRegion.setAttribute("aria-live", "polite");
        appStatusRegion.setAttribute("aria-atomic", "true");
        document.body.appendChild(appStatusRegion);
    }

    return appStatusRegion;
}

function announceStatus(message) {
    if (!message) return;

    const region = getAppStatusRegion();
    if (appStatusTimer) {
        window.clearTimeout(appStatusTimer);
    }

    region.textContent = "";
    window.requestAnimationFrame(() => {
        region.textContent = message;
    });

    appStatusTimer = window.setTimeout(() => {
        if (region.textContent === message) {
            region.textContent = "";
        }
    }, 2400);
}

async function copyText(value, fallbackInput) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        if (!fallbackInput || typeof document.execCommand !== "function") {
            return false;
        }

        fallbackInput.focus();
        fallbackInput.select();
        fallbackInput.setSelectionRange(0, 99999);

        try {
            return document.execCommand("copy");
        } catch {
            return false;
        }
    }
}

function clearThemeRefreshTimer() {
    if (themeRefreshTimer) {
        window.clearInterval(themeRefreshTimer);
        themeRefreshTimer = null;
    }
}

function applyThemeState(nextState, { persistMode = true } = {}) {
    themeState = nextState;

    htmlEl.setAttribute("data-theme", themeState.surfaceTheme);
    htmlEl.setAttribute("data-bs-theme", themeState.surfaceTheme);
    htmlEl.setAttribute("data-theme-mode", themeState.mode);
    htmlEl.setAttribute("data-time-theme", themeState.resolvedTheme);

    if (persistMode) {
        localStorage.setItem("theme-mode", themeState.mode);
    }

    localStorage.setItem("theme", themeState.surfaceTheme);
    updateThemeButton();
    updateThemeMeta(themeState.resolvedTheme, themeState.surfaceTheme);
}

function scheduleThemeRefresh() {
    clearThemeRefreshTimer();

    if (themeState.mode !== "auto") return;

    themeRefreshTimer = window.setInterval(() => {
        applyThemeState(getThemeState(themeState.mode), { persistMode: false });
    }, 60 * 1000);
}

function setThemeMode(mode, options = {}) {
    const { transition = false, ...themeOptions } = options;
    const updateTheme = () => {
        applyThemeState(getThemeState(mode), themeOptions);
        scheduleThemeRefresh();
    };

    if (transition) {
        runViewTransition(updateTheme, "theme");
        return;
    }

    updateTheme();
}

function cycleThemeMode() {
    const nextMode = timeTheme?.cycleThemeMode ? timeTheme.cycleThemeMode(themeState.mode) : "auto";
    setThemeMode(nextMode, { transition: true });

    const modeLabel = getThemeModeLabel(themeState.mode);
    const resolvedLabel = getThemeModeLabel(themeState.resolvedTheme);
    announceStatus(getUiText("theme_button_announce", `Theme mode: ${modeLabel}. Active palette: ${resolvedLabel}.`, {
        mode: modeLabel,
        resolved: resolvedLabel
    }));
}

function setLanguage(newLang, options = {}) {
    if (!translations[newLang]) return;

    const { transition = false } = options;
    const updateLanguage = () => {
        document.documentElement.lang = newLang;
        localStorage.setItem("selectedLanguage", newLang);

        if (langToggle) {
            langToggle.textContent = newLang === "tr" ? "EN" : "TR";
            const nextLanguageKey = newLang === "tr" ? "language_english" : "language_turkish";
            const nextLanguageFallback = newLang === "tr" ? "English" : "Türkçe";
            const nextLanguage = getUiText(nextLanguageKey, nextLanguageFallback);
            const label = getUiText("lang_button_label", `Change language. Next: ${nextLanguage}`, { language: nextLanguage });
            langToggle.setAttribute("aria-label", label);
            langToggle.setAttribute("title", label);
        }

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key || !translations[newLang][key]) return;

            if (key === "hero_title") {
                el.innerHTML = translations[newLang][key];
            } else {
                el.textContent = translations[newLang][key];
            }
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (!key || !translations[newLang][key]) return;
            el.setAttribute("placeholder", translations[newLang][key]);
        });

        const cmdkHint = document.getElementById("cmdkHint");
        if (cmdkHint) {
            cmdkHint.textContent = getUiText("cmdk_hint", "Enter to open | Esc to close | Ctrl+K to toggle");
        }

        updateThemeButton();
    };

    if (transition) {
        runViewTransition(updateLanguage, "language");
        return;
    }

    updateLanguage();
}

function trackEvent(eventName, detail = {}) {
    if (!eventName) return;
    const safeName = String(eventName).toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 64);
    if (!safeName) return;

    const payload = {
        name: safeName,
        path: window.location.pathname,
        ts: new Date().toISOString(),
        detail
    };

    window.dispatchEvent(new CustomEvent("portfolio:track", { detail: payload }));

    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: safeName, ...payload });
    }

    window.portfolioAnalytics?.track?.(safeName, payload);
}

function trackPageView() {
    const pageKey = `pv:${window.location.pathname}`;
    try {
        if (sessionStorage.getItem(pageKey)) return;
        sessionStorage.setItem(pageKey, "1");
    } catch {
        // Analytics should never block the portfolio experience.
    }
    trackEvent("page_view");
}

function bindTrackedClicks() {
    document.addEventListener("click", (event) => {
        const tracked = event.target instanceof Element ? event.target.closest("[data-track]") : null;
        if (!tracked) return;
        trackEvent(tracked.getAttribute("data-track"));
    });
}

async function updateLatestVideoLink() {
    const videoLink = document.getElementById("latest-video-link");
    if (!videoLink) return;

    try {
        const response = await fetch("assets/data/latest_video.json", { cache: "default" });
        if (!response.ok) throw new Error("latest video payload missing");
        const payload = await response.json();
        const latest = payload?.video;
        if (!latest?.url) throw new Error("invalid latest video payload");

        videoLink.href = latest.url;
        videoLink.textContent = latest.title ? `Netreka Akademi: ${latest.title}` : "Netreka Akademi";
    } catch {
        videoLink.href = "https://www.youtube.com/@Netreka_Akademi";
        videoLink.textContent = "Netreka Akademi";
    }
}

function getContactHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CONTACT_LIMIT_KEY) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((value) => Number.isFinite(value));
    } catch {
        return [];
    }
}

function storeContactHistory(history) {
    localStorage.setItem(CONTACT_LIMIT_KEY, JSON.stringify(history));
}

function checkContactRateLimit() {
    const now = Date.now();
    const recent = getContactHistory().filter((stamp) => now - stamp <= CONTACT_WINDOW_MS);

    if (recent.length >= CONTACT_MAX_IN_WINDOW) {
        return {
            ok: false,
            reason: getUiText("contact_rate_limit_window", "Too many messages in the last hour. Please try later.")
        };
    }

    const latest = recent[recent.length - 1];
    if (latest && now - latest < CONTACT_MIN_GAP_MS) {
        const waitSeconds = Math.ceil((CONTACT_MIN_GAP_MS - (now - latest)) / 1000);
        return {
            ok: false,
            reason: getUiText("contact_rate_limit_gap", `Please wait ${waitSeconds}s before sending another message.`, { seconds: waitSeconds })
        };
    }

    return { ok: true, recent };
}

function registerContactSubmit(recentHistory) {
    const updated = [...recentHistory, Date.now()];
    storeContactHistory(updated);
}

function setupContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");
    if (!form || !status) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitBtn?.textContent?.trim() || getUiText("contact_submit", "Send Message");
    let isSubmitting = false;

    const updateSubmitState = (busy) => {
        if (!submitBtn) return;
        submitBtn.disabled = busy;
        submitBtn.textContent = busy ? getUiText("contact_sending", "Sending...") : getUiText("contact_submit", defaultSubmitLabel);
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        status.classList.remove("success", "error");
        status.textContent = "";

        if (!form.reportValidity()) {
            return;
        }

        const honey = form.querySelector("#contact-honey");
        if (honey && honey.value.trim() !== "") {
            status.classList.add("error");
            status.textContent = getUiText("contact_spam", "Spam filter blocked this submission.");
            return;
        }

        const rate = checkContactRateLimit();
        if (!rate.ok) {
            status.classList.add("error");
            status.textContent = rate.reason;
            return;
        }

        const formData = new FormData(form);
        ["name", "email", "message"].forEach((field) => {
            const value = formData.get(field);
            if (typeof value === "string") {
                formData.set(field, value.trim());
            }
        });

        const requiredFieldOrder = ["name", "email", "message"];
        const missingField = requiredFieldOrder.find((field) => {
            const value = formData.get(field);
            return typeof value !== "string" || value.length === 0;
        });

        if (missingField) {
            status.classList.add("error");
            status.textContent = getUiText("contact_required", "Please fill in all fields.");
            form.querySelector(`[name="${missingField}"]`)?.focus();
            return;
        }

        isSubmitting = true;
        form.setAttribute("aria-busy", "true");
        updateSubmitState(true);

        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) throw new Error(`Contact form request failed (${response.status})`);

            registerContactSubmit(rate.recent || []);
            form.reset();
            status.classList.add("success");
            status.textContent = getUiText("contact_success", "Message sent successfully.");
            trackEvent("contact_submit_success");
        } catch {
            status.classList.add("error");
            status.textContent = getUiText("contact_error", "Message could not be sent. Please retry or use email copy.");
            trackEvent("contact_submit_error");
        } finally {
            isSubmitting = false;
            form.setAttribute("aria-busy", "false");
            updateSubmitState(false);
        }
    });
}

function setupCopyButton() {
    if (!copyBtn || !emailInput) return;
    let resetTimer = null;

    copyBtn.addEventListener("click", async () => {
        const copied = await copyText(emailInput.value, emailInput);

        if (copied) {
            copyBtn.textContent = getUiText("copy_success", "Copied!");
            announceStatus(getUiText("email_copied", "Email copied."));

            if (resetTimer) {
                window.clearTimeout(resetTimer);
            }

            resetTimer = window.setTimeout(() => {
                copyBtn.textContent = getUiText("btn_copy", "Copy Email");
            }, 2000);
        } else {
            announceStatus(getUiText("copy_error", "Copy failed. You can select the email address manually."));
        }
    });
}

function setupMobileMenu() {
    const mobileBtn = document.querySelector(".mobile-menu-btn");
    const navPanel = document.getElementById("primary-navigation");
    if (!mobileBtn || !navPanel) return;

    const icon = mobileBtn.querySelector("i");
    const existingBackdrop = document.querySelector(".mobile-nav-backdrop");
    const backdrop = existingBackdrop || document.createElement("button");

    if (!existingBackdrop) {
        backdrop.type = "button";
        backdrop.className = "mobile-nav-backdrop";
        backdrop.tabIndex = -1;
        backdrop.setAttribute("aria-hidden", "true");
        document.body.appendChild(backdrop);
    }

    const setMenuState = (isActive) => {
        navPanel.classList.toggle("active", isActive);
        document.body.classList.toggle("menu-open", isActive);
        mobileBtn.setAttribute("aria-expanded", String(isActive));

        if (!icon) return;

        if (isActive) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        } else {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    };

    const closeMenu = () => setMenuState(false);

    mobileBtn.addEventListener("click", () => {
        const nextState = !navPanel.classList.contains("active");
        setMenuState(nextState);
    });

    backdrop.addEventListener("click", closeMenu);

    navPanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navPanel.classList.contains("active")) {
            closeMenu();
        }
    });

    const desktopQuery = window.matchMedia("(min-width: 821px)");
    const handleViewportChange = (event) => {
        if (event.matches) {
            closeMenu();
        }
    };

    if (typeof desktopQuery.addEventListener === "function") {
        desktopQuery.addEventListener("change", handleViewportChange);
    } else if (typeof desktopQuery.addListener === "function") {
        desktopQuery.addListener(handleViewportChange);
    }
}

function setupActiveNav() {
    const sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const homeLink = document.querySelector('.top-dock-logo[href^="#"]');
    if (!sectionLinks.length) return;

    const setActiveLink = (targetId) => {
        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${targetId}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (homeLink) {
            const isHomeActive = homeLink.getAttribute("href") === `#${targetId}`;
            homeLink.classList.toggle("is-active", isHomeActive);

            if (isHomeActive) {
                homeLink.setAttribute("aria-current", "page");
            } else {
                homeLink.removeAttribute("aria-current");
            }
        }
    };

    const homeTargetId = homeLink?.getAttribute("href")?.slice(1);
    const homeSection = homeTargetId ? document.getElementById(homeTargetId) : null;
    const sections = [
        homeSection,
        ...sectionLinks.map((link) => document.querySelector(link.getAttribute("href")))
    ].filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry?.target?.id) return;
        setActiveLink(visibleEntry.target.id);
    }, {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7]
    });

    sections.forEach((section) => observer.observe(section));

    sectionLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const targetId = link.getAttribute("href")?.slice(1);
            if (targetId) setActiveLink(targetId);
        });
    });

    const initialTarget = window.location.hash?.slice(1) || homeSection?.id || sections[0].id;
    setActiveLink(initialTarget);
}

function setupHeaderState() {
    const updateHeaderState = () => {
        htmlEl.setAttribute("data-scrolled", window.scrollY > 28 ? "1" : "0");
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
            updateHeaderState();
            ticking = false;
        });
    }, { passive: true });

    updateHeaderState();
}

function setupScrollProgress() {
    const progressBar = document.querySelector(".scroll-progress span");
    if (!progressBar) return;

    const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
        progressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
    };

    let ticking = false;
    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
        });
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateProgress();
}

function setupRevealAnimations() {
    if (performanceProfile.lowPower) {
        htmlEl.classList.add("js-ready");
        return;
    }

    const revealTargets = [
        ...document.querySelectorAll(".hero-content > *:not(.visually-hidden)"),
        ...document.querySelectorAll(".section-title"),
        ...document.querySelectorAll(".mission-shell, .mission-quote, .mission-pillar, .skill-category, .project-card, .book-card, .community-card, .community-panel, .community-guide-card, .community-channel-card, .hall-of-fame, .notice-card, .contact-cta, .socials a, .footer-meta")
    ];

    const uniqueTargets = [...new Set(revealTargets.filter(Boolean))];
    if (!uniqueTargets.length) return;

    uniqueTargets.forEach((element, index) => {
        element.classList.add("reveal-up");
        const delay = element.closest(".hero") ? Math.min(index * 70, 420) : Math.min((index % 6) * 80, 320);
        element.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    window.requestAnimationFrame(() => {
        htmlEl.classList.add("js-ready");
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        uniqueTargets.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
    });

    uniqueTargets.forEach((element) => {
        if (element.closest(".hero")) {
            element.classList.add("is-visible");
            return;
        }

        observer.observe(element);
    });
}

function setupGeometricInteractions() {
    if (performanceProfile.lowPower) return;

    const targets = [
        ...document.querySelectorAll(".skill-category, .project-card, .book-card--link, .mission-pillar, .community-card, .social-card")
    ].filter(Boolean);

    if (!targets.length) return;

    targets.forEach((element) => element.classList.add("is-geometry-live"));

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    targets.forEach((element) => {
        element.addEventListener("pointermove", (event) => {
            const rect = element.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
            const tiltX = (0.5 - y) * 6;
            const tiltY = (x - 0.5) * 6;

            element.style.setProperty("--pointer-x", `${Math.round(x * 100)}%`);
            element.style.setProperty("--pointer-y", `${Math.round(y * 100)}%`);
            element.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
            element.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        }, { passive: true });

        element.addEventListener("pointerleave", () => {
            element.style.setProperty("--pointer-x", "50%");
            element.style.setProperty("--pointer-y", "50%");
            element.style.setProperty("--tilt-x", "0deg");
            element.style.setProperty("--tilt-y", "0deg");
        });
    });
}

function setupCommandPalette() {
    const cmdk = document.getElementById("cmdk");
    const cmdkInput = document.getElementById("cmdkInput");
    const cmdkCloseBtn = document.getElementById("cmdkClose");
    const cmdkList = document.getElementById("cmdkList");
    const cmdkEmpty = document.getElementById("cmdkEmpty");

    if (!cmdk || !cmdkInput || !cmdkCloseBtn || !cmdkList || !cmdkEmpty) return;

    if (typeof cmdk.showModal !== "function") {
        cmdk.remove();
        return;
    }

    if (performanceProfile.lowPower) {
        cmdk.remove();
        return;
    }

    cmdkInput.setAttribute("aria-expanded", "false");

    const scrollToTarget = (selector) => {
        document.querySelector(selector)?.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "start"
        });
    };

    const actions = [
        {
            key: "github",
            aliases: ["repo", "kod"],
            label: "GitHub",
            descriptionKey: "cmdk_desc_github",
            icon: "fab fa-github",
            run: () => window.open("https://github.com/YasinEnginn", "_blank", "noopener")
        },
        {
            key: "linkedin",
            aliases: ["profil", "profile"],
            label: "LinkedIn",
            descriptionKey: "cmdk_desc_linkedin",
            icon: "fab fa-linkedin",
            run: () => window.open("https://www.linkedin.com/in/yasin-engin/", "_blank", "noopener")
        },
        {
            key: "projects",
            aliases: ["projeler", "repos", "repo"],
            labelKey: "nav_projects",
            fallbackLabel: "Projects",
            descriptionKey: "cmdk_desc_projects",
            icon: "fas fa-diagram-project",
            run: () => scrollToTarget("#projects")
        },
        {
            key: "notes",
            aliases: ["notlar", "engineering notes"],
            labelKey: "nav_notes",
            fallbackLabel: "Notes",
            descriptionKey: "cmdk_desc_notes",
            icon: "fas fa-note-sticky",
            run: () => { window.location.href = "notes/"; }
        },
        {
            key: "case studies",
            aliases: ["vaka incelemeleri", "case", "vakalar"],
            labelKey: "hero_case_studies",
            fallbackLabel: "Case Studies",
            descriptionKey: "cmdk_desc_case_studies",
            icon: "fas fa-folder-open",
            run: () => { window.location.href = "case-studies/"; }
        },
        {
            key: "cv",
            aliases: ["resume", "özgeçmiş"],
            labelKey: "hero_cv_view",
            fallbackLabel: "CV",
            descriptionKey: "cmdk_desc_cv",
            icon: "fas fa-id-card",
            run: () => { window.location.href = "cv.html"; }
        },
        {
            key: "cv pdf",
            aliases: ["pdf", "resume pdf"],
            labelKey: "hero_cv_pdf",
            fallbackLabel: "PDF CV",
            descriptionKey: "cmdk_desc_cv_pdf",
            icon: "fas fa-file-pdf",
            run: () => window.open("assets/docs/yasin_engin_cv.pdf", "_blank", "noopener")
        },
        {
            key: "library",
            aliases: ["kütüphane", "kitap", "papers", "books"],
            labelKey: "nav_library",
            fallbackLabel: "Library",
            descriptionKey: "cmdk_desc_library",
            icon: "fas fa-book-open",
            run: () => scrollToTarget("#library")
        },
        {
            key: "youtube",
            aliases: ["netreka", "video"],
            labelKey: "nav_youtube",
            fallbackLabel: "YouTube",
            descriptionKey: "cmdk_desc_youtube",
            icon: "fab fa-youtube",
            run: () => scrollToTarget("#youtube")
        },
        {
            key: "contact",
            aliases: ["iletişim", "email", "mail"],
            labelKey: "nav_contact",
            fallbackLabel: "Contact",
            descriptionKey: "cmdk_desc_contact",
            icon: "fas fa-envelope",
            run: () => scrollToTarget("#contact")
        },
        {
            key: "theme",
            aliases: ["tema", "dark", "light", "night", "day"],
            labelKey: "cmdk_action_theme",
            fallbackLabel: "Change theme",
            descriptionKey: "cmdk_desc_theme",
            icon: "fas fa-circle-half-stroke",
            run: cycleThemeMode
        },
        {
            key: "focus", run: () => {
                const isEnabled = document.body.classList.toggle("focus-mode");
                announceStatus(getUiText(
                    isEnabled ? "focus_mode_enabled" : "focus_mode_disabled",
                    isEnabled ? "Focus mode enabled." : "Focus mode disabled."
                ));
            },
            aliases: ["odak", "zen"],
            labelKey: "cmdk_action_focus",
            fallbackLabel: "Focus mode",
            descriptionKey: "cmdk_desc_focus",
            icon: "fas fa-bullseye"
        },
        {
            key: "lang tr",
            aliases: ["dil tr", "türkçe"],
            labelKey: "cmdk_action_language_tr",
            fallbackLabel: "Switch to Turkish",
            descriptionKey: "cmdk_desc_language",
            icon: "fas fa-language",
            run: () => setLanguage("tr", { transition: true })
        },
        {
            key: "lang en",
            aliases: ["dil en", "english", "ingilizce"],
            labelKey: "cmdk_action_language_en",
            fallbackLabel: "Switch to English",
            descriptionKey: "cmdk_desc_language",
            icon: "fas fa-language",
            run: () => setLanguage("en", { transition: true })
        },
        { key: "projects: netreka", run: () => window.open("https://github.com/YasinEnginn/Netreka-Nexus", "_blank", "noopener") },
        { key: "projects: tolerex", run: () => window.open("https://github.com/YasinEnginn/Tolerex", "_blank", "noopener") },
        { key: "projects: rest-api", run: () => window.open("https://github.com/YasinEnginn/REST-API", "_blank", "noopener") },
        {
            key: "vcard", run: () => {
                const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Yasin Engin
N:Engin;Yasin;;;
TITLE:Computer Engineering Student
EMAIL;TYPE=INTERNET;TYPE=WORK:yasinenginofficial@gmail.com
URL:https://yasinenginn.github.io/
NOTE:Network Automation, SDN, Go Backend, Distributed Systems
END:VCARD`;
                const blob = new Blob([vcardData], { type: "text/vcard" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Yasin_Engin.vcf";
                a.click();
                URL.revokeObjectURL(url);
            },
            aliases: ["contact card", "kişi kartı"],
            labelKey: "cmdk_action_vcard",
            fallbackLabel: "Download vCard",
            descriptionKey: "cmdk_desc_vcard",
            icon: "fas fa-address-card"
        },
        {
            key: "email", run: async () => {
                const mail = ["yasinenginofficial", "gmail.com"].join("@");
                const copied = await copyText(mail, emailInput);
                if (copied) {
                    announceStatus(getUiText("email_copied", "Email copied."));
                } else {
                    window.location.href = `mailto:${mail}`;
                }
            },
            aliases: ["mail", "e-posta", "copy email"],
            labelKey: "cmdk_action_email",
            fallbackLabel: "Copy email",
            descriptionKey: "cmdk_desc_email",
            icon: "fas fa-at"
        },
        { key: "instagram", aliases: ["ig"], label: "Instagram", descriptionKey: "social_hint_instagram", icon: "fab fa-instagram", run: () => window.open("https://www.instagram.com/yasinengineering/", "_blank", "noopener") },
        { key: "idea", run: () => document.getElementById("ideas")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "help", run: () => document.getElementById("help-wanted")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "submit", run: () => document.getElementById("showcase")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "discuss", run: () => document.getElementById("discussion")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) }
    ];

    let visibleActions = [];
    let activeIndex = 0;

    const getActionLabel = (action) => getUiText(action.labelKey, action.label || action.fallbackLabel || action.key);
    const getActionDescription = (action) => getUiText(action.descriptionKey, action.description || action.key);
    const normalize = (value) => String(value || "").toLocaleLowerCase(getCurrentLanguage() === "tr" ? "tr" : "en");
    const getSearchText = (action) => normalize([
        action.key,
        ...(action.aliases || []),
        getActionLabel(action),
        getActionDescription(action)
    ].join(" "));

    const matchActions = (query) => {
        const normalizedQuery = normalize(query.trim());
        const visibleCandidates = actions.filter((action) => action.labelKey || action.label || action.fallbackLabel);

        if (!normalizedQuery) return visibleCandidates.slice(0, 10);

        return visibleCandidates
            .map((action) => {
                const key = normalize(action.key);
                const aliases = (action.aliases || []).map(normalize);
                const searchText = getSearchText(action);
                const starts = key.startsWith(normalizedQuery) || aliases.some((alias) => alias.startsWith(normalizedQuery));
                const includes = searchText.includes(normalizedQuery);

                return {
                    action,
                    score: starts ? 0 : includes ? 1 : 2
                };
            })
            .filter((entry) => entry.score < 2)
            .sort((a, b) => a.score - b.score || getActionLabel(a.action).localeCompare(getActionLabel(b.action)))
            .slice(0, 10)
            .map((entry) => entry.action);
    };

    const runAction = (action) => {
        if (!action) return;

        cmdk.close();
        cmdkInput.value = "";
        renderActions();
        Promise.resolve(action.run()).catch(() => {
            announceStatus(getUiText("contact_error", "Something went wrong. Please retry."));
        });
    };

    const setActiveIndex = (nextIndex) => {
        if (!visibleActions.length) {
            activeIndex = 0;
            cmdkInput.removeAttribute("aria-activedescendant");
            return;
        }

        activeIndex = (nextIndex + visibleActions.length) % visibleActions.length;
        const activeOption = cmdkList.querySelector(`[data-index="${activeIndex}"]`);

        cmdkList.querySelectorAll(".cmdk-option").forEach((option, index) => {
            const selected = index === activeIndex;
            option.setAttribute("aria-selected", String(selected));
            option.tabIndex = selected ? 0 : -1;
        });

        if (activeOption) {
            cmdkInput.setAttribute("aria-activedescendant", activeOption.id);
            activeOption.scrollIntoView({ block: "nearest" });
        }
    };

    function renderActions() {
        visibleActions = matchActions(cmdkInput.value);
        activeIndex = Math.min(activeIndex, Math.max(visibleActions.length - 1, 0));
        cmdkList.textContent = "";

        visibleActions.forEach((action, index) => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "cmdk-option";
            option.id = `cmdk-option-${index}`;
            option.dataset.index = String(index);
            option.setAttribute("role", "option");

            const icon = document.createElement("span");
            icon.className = "cmdk-option-icon";
            icon.setAttribute("aria-hidden", "true");

            const iconGlyph = document.createElement("i");
            iconGlyph.className = action.icon || "fas fa-arrow-right";
            icon.appendChild(iconGlyph);

            const body = document.createElement("span");
            body.className = "cmdk-option-body";

            const label = document.createElement("strong");
            label.textContent = getActionLabel(action);

            const description = document.createElement("span");
            description.textContent = getActionDescription(action);

            const shortcut = document.createElement("kbd");
            shortcut.className = "cmdk-shortcut";
            shortcut.textContent = action.key;

            body.append(label, description);
            option.append(icon, body, shortcut);

            option.addEventListener("pointerenter", () => setActiveIndex(index));
            option.addEventListener("click", () => runAction(action));
            cmdkList.appendChild(option);
        });

        cmdkList.hidden = visibleActions.length === 0;
        cmdkEmpty.hidden = visibleActions.length > 0;
        setActiveIndex(activeIndex);
    }

    const toggleCmdk = () => {
        if (cmdk.open) {
            cmdk.close();
            return;
        }

        activeIndex = 0;
        renderActions();
        cmdk.showModal();
        cmdkInput.setAttribute("aria-expanded", "true");
        window.requestAnimationFrame(() => cmdkInput.focus());
    };

    cmdkCloseBtn.addEventListener("click", () => cmdk.close());

    window.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            toggleCmdk();
        }
        if (event.key === "Escape" && cmdk.open) {
            cmdk.close();
        }
    });

    cmdk.addEventListener("close", () => {
        cmdkInput.value = "";
        cmdkInput.setAttribute("aria-expanded", "false");
        activeIndex = 0;
        renderActions();
    });

    cmdkInput.addEventListener("input", () => {
        activeIndex = 0;
        renderActions();
    });

    cmdkInput.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(activeIndex + 1);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(activeIndex - 1);
            return;
        }

        if (event.key !== "Enter") return;

        const query = normalize(cmdkInput.value.trim());
        const exactHit = actions.find((action) => normalize(action.key) === query) || actions.find((action) => normalize(action.key).startsWith(query));
        const hit = visibleActions[activeIndex] || exactHit;

        if (hit) {
            event.preventDefault();
            runAction(hit);
        }
    });

    renderActions();
}

function initialize() {
    const hasTopDock = Boolean(document.querySelector(".site-nav"));
    document.body.classList.toggle("has-top-dock", hasTopDock);
    htmlEl.classList.toggle("has-top-dock", hasTopDock);

    const currentThemeMode = timeTheme?.getStoredMode ? timeTheme.getStoredMode() : (localStorage.getItem("theme") || "auto");
    setThemeMode(currentThemeMode);

    const storedLang = localStorage.getItem("selectedLanguage");
    const defaultLang = (storedLang && translations[storedLang]) ? storedLang : (document.documentElement.lang || "tr");
    setLanguage(defaultLang);

    if (themeBtn) {
        themeBtn.addEventListener("click", cycleThemeMode);
    }

    if (langToggle) {
        langToggle.addEventListener("click", () => {
            const next = document.documentElement.lang === "tr" ? "en" : "tr";
            setLanguage(next, { transition: true });
        });
    }

    if (emailInput) {
        const part1 = "yasinenginofficial";
        const part2 = "gmail.com";
        emailInput.value = `${part1}@${part2}`;
    }

    setupCopyButton();
    setupMobileMenu();
    setupActiveNav();
    setupHeaderState();
    setupScrollProgress();
    setupRevealAnimations();
    setupGeometricInteractions();
    setupCommandPalette();
    setupContactForm();
    bindTrackedClicks();
    trackPageView();
    updateLatestVideoLink();
}

initialize();
