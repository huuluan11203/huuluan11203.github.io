(function () {
  "use strict";

  const EMAIL = "huuluan11203@gmail.com";

  const I18N = {
    vi: {
      docTitle: "Bùi Hữu Luân — Software Engineer | Portfolio",
      "nav.home": "Trang chủ",
      "nav.about": "Giới thiệu",
      "nav.skills": "Công nghệ",
      "nav.expertise": "Năng lực",
      "nav.contact": "Liên hệ",
      "nav.cta": "Liên hệ với tôi",
      "nav.switchLabel": "Ngôn ngữ: Tiếng Việt → EN",
      "theme.toLight": "Chuyển sang chế độ sáng",
      "theme.toDark": "Chuyển sang chế độ tối",
      "theme.labelToLight": "Giao diện: Tối → Sáng",
      "theme.labelToDark": "Giao diện: Sáng → Tối",

      "hero.subhead":
        "Tận dụng AI để làm nhanh hơn, nhưng mọi dòng code đều được tôi hiểu, kiểm chứng và chịu trách nhiệm.",
      "hero.cta": "Xem năng lực",
      "hero.cta2": "Liên hệ",

      "facts.f1": "Backend chủ lực",
      "facts.f2": "Cơ sở dữ liệu quan hệ",
      "facts.f3Title": "Thiết kế hệ thống",
      "facts.f3": "API phân tầng · đồng thời",
      "facts.f4Title": "Đại học Sài Gòn",
      "facts.f4": "CNTT · 2022 – nay",

      "about.title": "Xây backend chắc chắn, hiểu rõ từng quyết định.",
      "about.lead":
        "Sinh viên năm cuối ngành Công nghệ Thông tin tại Đại học Sài Gòn, định hướng Backend / Software Engineer.",
      "about.p1":
        "Thế mạnh của tôi là Java và Spring Boot: thiết kế RESTful API theo kiến trúc phân tầng, mô hình hoá dữ liệu trên PostgreSQL / MySQL và đảm bảo hệ thống vẫn chạy đúng khi nhiều người dùng thao tác cùng lúc.",
      "about.p2":
        "Bên cạnh Java, tôi làm việc với JavaScript, C# (ASP.NET Core) và Python. Tôi đang tìm vị trí Fresher Software Developer để đóng góp vào sản phẩm thực tế, làm việc trong môi trường Agile/Scrum và phát triển lên Software Engineer.",
      "about.f1Label": "Học vấn",
      "about.f1Val": "Đại học Sài Gòn — CNTT (2022 – nay)",
      "about.f2Label": "Định hướng",
      "about.f2Val": "Backend · Software Engineer",
      "about.f3Label": "Công nghệ chính",
      "about.f4Label": "Khu vực",
      "about.f4Val": "TP. Hồ Chí Minh",
      "about.contactBtn": "Liên hệ trực tiếp",

      "skills.title": "Công cụ tôi dùng mỗi ngày.",
      "skills.subtitle":
        "Java là ngôn ngữ chính; các công nghệ còn lại giúp tôi đi trọn vòng đời một tính năng — từ thiết kế dữ liệu đến kiểm thử và đóng gói.",
      "skills.g1": "Ngôn ngữ",
      "skills.g2": "Backend & Framework",
      "skills.g3": "Cơ sở dữ liệu",
      "skills.g4": "Kiểm thử & Công cụ",
      "skills.g5": "Đang tìm hiểu & đã làm quen",
      "skills.dbModel": "Mô hình hoá dữ liệu",
      "skills.dbTune": "Tối ưu truy vấn",

      "exp.title": "Những bài toán tôi xử lý được.",
      "exp.subtitle":
        "Không chỉ viết cho chạy — tôi quan tâm hệ thống chạy đúng, nhanh và an toàn khi lượng dữ liệu và người dùng tăng lên.",
      "exp.c1Title": "Thiết kế hệ thống & API",
      "exp.c1Desc":
        "RESTful API theo kiến trúc phân tầng Controller – Service – Repository, tách bạch nghiệp vụ để dễ mở rộng và bảo trì; tài liệu hoá bằng Swagger / OpenAPI.",
      "exp.c2Title": "Xử lý truy cập đồng thời",
      "exp.c2Desc":
        "Ngăn race condition khi nhiều người dùng cùng thao tác trên một tài nguyên bằng Pessimistic Locking và quản lý transaction, giữ dữ liệu luôn chính xác.",
      "exp.c3Title": "Tối ưu truy vấn",
      "exp.c3Desc":
        "Phát hiện và xử lý N+1 query bằng JOIN FETCH / EntityGraph, giảm số lần truy cập database không cần thiết và tăng tốc độ tải dữ liệu.",
      "exp.c4Title": "Xác thực & phân quyền",
      "exp.c4Desc": "Xác thực stateless với JWT và phân quyền theo vai trò bằng Spring Security.",
      "exp.c5Title": "Kiểm thử tự động",
      "exp.c5Desc":
        "Viết unit test cho tầng controller và service với JUnit, Mockito, AssertJ để thay đổi và refactor code một cách an toàn.",
      "exp.c6Title": "Thuật toán & tối ưu hoá",
      "exp.c6Desc":
        "Giải thuật metaheuristic (Genetic Algorithm, ALNS), các toán tử local search và xử lý dữ liệu không gian cho bài toán tối ưu.",

      "ai.p1Title": "Hiểu trước, sinh code sau",
      "ai.p1Desc": "Tôi tự phân tích bài toán và thiết kế giải pháp; AI chỉ giúp đẩy nhanh phần triển khai.",
      "ai.p2Title": "Kiểm chứng mọi đầu ra",
      "ai.p2Desc": "Code do AI gợi ý luôn được đọc hiểu, viết test và review như code của bất kỳ ai khác.",
      "ai.p3Title": "Làm chủ quyết định",
      "ai.p3Desc":
        "Kiến trúc, đánh đổi kỹ thuật và chất lượng sản phẩm là trách nhiệm của tôi — không phải của công cụ.",
      "ai.researchLabel": "Nghiên cứu",
      "ai.research":
        "Bài báo “Đề xuất khung điều phối prompt động để giải đề thi Toán tốt nghiệp THPT Việt Nam bằng mô hình ngôn ngữ lớn” — đã nộp tới hội nghị AIIA 2026 (The second AI Bridge Conference).",

      "contact.title": "Cùng trao đổi nhé.",
      "contact.subtitle":
        "Tôi đang tìm vị trí Fresher Software Developer. Nếu bạn có cơ hội phù hợp hoặc muốn trao đổi, hãy để lại lời nhắn.",
      "contact.copy": "Sao chép",
      "contact.copied": "Đã chép!",
      "contact.phoneLabel": "ĐIỆN THOẠI",
      "contact.socialLabel": "MẠNG XÃ HỘI",
      "contact.locLabel": "KHU VỰC",
      "contact.locVal": "TP. Hồ Chí Minh, Việt Nam",
      "contact.nameLabel": "Họ và tên của bạn",
      "contact.namePh": "Nguyễn Văn A",
      "contact.emailLabel": "Địa chỉ Email",
      "contact.emailPh": "ban@congty.com",
      "contact.msgLabel": "Nội dung",
      "contact.msgPh": "Vị trí, cơ hội hoặc điều bạn muốn trao đổi...",
      "contact.sendBtn": "Gửi lời nhắn",
      "contact.errInvalid": "Vui lòng điền đầy đủ họ tên, email hợp lệ và nội dung lời nhắn.",
      "contact.sentOk": "Cảm ơn bạn! Đang mở ứng dụng email để gửi lời nhắn tới Bùi Hữu Luân.",

      "footer.note": "Software Engineer · TP. Hồ Chí Minh",
      "footer.top": "Lên đầu trang ↑",
    },

    en: {
      docTitle: "Bùi Hữu Luân — Software Engineer | Portfolio",
      "nav.home": "Home",
      "nav.about": "About",
      "nav.skills": "Tech stack",
      "nav.expertise": "Expertise",
      "nav.contact": "Contact",
      "nav.cta": "Get in touch",
      "nav.switchLabel": "Language: English → VI",
      "theme.toLight": "Switch to light mode",
      "theme.toDark": "Switch to dark mode",
      "theme.labelToLight": "Theme: Dark → Light",
      "theme.labelToDark": "Theme: Light → Dark",

      "hero.subhead":
        "I leverage AI to move faster, but every line of code is understood, verified and owned by me.",
      "hero.cta": "See my expertise",
      "hero.cta2": "Contact",

      "facts.f1": "Primary backend stack",
      "facts.f2": "Relational databases",
      "facts.f3Title": "System design",
      "facts.f3": "Layered APIs · concurrency",
      "facts.f4Title": "Saigon University",
      "facts.f4": "IT · 2022 – present",

      "about.title": "Building solid backends, understanding every decision.",
      "about.lead":
        "Final-year Information Technology student at Saigon University, focused on Backend / Software Engineering.",
      "about.p1":
        "My core strength is Java and Spring Boot: designing RESTful APIs with a layered architecture, modelling data in PostgreSQL / MySQL, and keeping systems correct when many users act at the same time.",
      "about.p2":
        "Beyond Java, I work with JavaScript, C# (ASP.NET Core) and Python. I'm looking for a Fresher Software Developer role to contribute to real products, work in an Agile/Scrum team, and grow into a full-time Software Engineer.",
      "about.f1Label": "Education",
      "about.f1Val": "Saigon University — IT (2022 – present)",
      "about.f2Label": "Focus",
      "about.f2Val": "Backend · Software Engineer",
      "about.f3Label": "Core stack",
      "about.f4Label": "Location",
      "about.f4Val": "Ho Chi Minh City",
      "about.contactBtn": "Get in touch",

      "skills.title": "The tools I use every day.",
      "skills.subtitle":
        "Java is my primary language; the rest lets me take a feature through its whole lifecycle — from data design to testing and packaging.",
      "skills.g1": "Languages",
      "skills.g2": "Backend & Frameworks",
      "skills.g3": "Databases",
      "skills.g4": "Testing & Tools",
      "skills.g5": "Familiar with & exploring",
      "skills.dbModel": "Data modelling",
      "skills.dbTune": "Query optimisation",

      "exp.title": "Problems I know how to solve.",
      "exp.subtitle":
        "Not just making it run — I care that systems stay correct, fast and secure as data and users grow.",
      "exp.c1Title": "System & API design",
      "exp.c1Desc":
        "RESTful APIs with a layered Controller – Service – Repository architecture, clean separation of business logic for easy extension, documented with Swagger / OpenAPI.",
      "exp.c2Title": "Concurrency control",
      "exp.c2Desc":
        "Preventing race conditions when many users act on the same resource, using Pessimistic Locking and transaction management to keep data accurate.",
      "exp.c3Title": "Query optimisation",
      "exp.c3Desc":
        "Detecting and fixing N+1 queries with JOIN FETCH / EntityGraph, cutting unnecessary database round trips and speeding up data retrieval.",
      "exp.c4Title": "Authentication & authorisation",
      "exp.c4Desc": "Stateless authentication with JWT and role-based authorisation with Spring Security.",
      "exp.c5Title": "Automated testing",
      "exp.c5Desc":
        "Unit tests for controller and service layers with JUnit, Mockito and AssertJ, so code can be changed and refactored safely.",
      "exp.c6Title": "Algorithms & optimisation",
      "exp.c6Desc":
        "Metaheuristics (Genetic Algorithm, ALNS), local search operators and geospatial data processing for optimisation problems.",

      "ai.p1Title": "Understand first, generate later",
      "ai.p1Desc": "I analyse the problem and design the solution myself; AI only speeds up the implementation.",
      "ai.p2Title": "Verify every output",
      "ai.p2Desc": "AI-suggested code is always read, tested and reviewed like anyone else's code.",
      "ai.p3Title": "Own the decisions",
      "ai.p3Desc": "Architecture, technical trade-offs and product quality are my responsibility — not the tool's.",
      "ai.researchLabel": "Research",
      "ai.research":
        "“Proposing a Dynamic Prompt Orchestration Framework for Solving Vietnamese High School Graduation Mathematics Exams Using Large Language Models” — paper submitted to AIIA 2026 (The second AI Bridge Conference).",

      "contact.title": "Let's talk.",
      "contact.subtitle":
        "I'm looking for a Fresher Software Developer role. If you have a suitable opportunity or just want to chat, leave me a message.",
      "contact.copy": "Copy",
      "contact.copied": "Copied!",
      "contact.phoneLabel": "PHONE",
      "contact.socialLabel": "PROFILES",
      "contact.locLabel": "LOCATION",
      "contact.locVal": "Ho Chi Minh City, Vietnam",
      "contact.nameLabel": "Your name",
      "contact.namePh": "Alex Nguyen",
      "contact.emailLabel": "Email address",
      "contact.emailPh": "you@company.com",
      "contact.msgLabel": "Message",
      "contact.msgPh": "The role, opportunity or topic you'd like to discuss...",
      "contact.sendBtn": "Send message",
      "contact.errInvalid": "Please enter your name, a valid email address and a message.",
      "contact.sentOk": "Thank you! Opening your mail client to send the message to Bùi Hữu Luân.",

      "footer.note": "Software Engineer · Ho Chi Minh City",
      "footer.top": "Back to top ↑",
    },
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1) LANGUAGE SWITCHER (VI / EN)
     --------------------------------------------------------- */
  let currentLang = "vi";
  try {
    const saved = window.localStorage.getItem("bhl_portfolio_lang");
    if (saved === "en" || saved === "vi") currentLang = saved;
  } catch (_) {
    /* ignore storage restrictions */
  }

  const i18nNodes = document.querySelectorAll("[data-i18n]");
  const i18nPlaceholders = document.querySelectorAll("[data-i18n-placeholder]");
  const langIndicators = document.querySelectorAll("[data-lang-ind]");
  const formStatus = document.getElementById("formStatus");

  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.vi;
    currentLang = lang;
    document.documentElement.lang = lang;
    document.title = dict.docTitle;

    i18nNodes.forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key] !== undefined) node.textContent = dict[key];
    });

    i18nPlaceholders.forEach((input) => {
      const key = input.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) input.setAttribute("placeholder", dict[key]);
    });

    langIndicators.forEach((ind) => {
      ind.classList.toggle("active", ind.getAttribute("data-lang-ind") === lang);
    });

    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("is-error");
    }

    updateThemeLabels();

    try {
      window.localStorage.setItem("bhl_portfolio_lang", lang);
    } catch (_) {
      /* ignore storage restrictions */
    }
  }

  function toggleLanguage() {
    applyLanguage(currentLang === "vi" ? "en" : "vi");
  }

  const langBtnDesktop = document.getElementById("langToggleDesktop");
  const langBtnMobile = document.getElementById("langToggleMobile");
  if (langBtnDesktop) langBtnDesktop.addEventListener("click", toggleLanguage);
  if (langBtnMobile) langBtnMobile.addEventListener("click", toggleLanguage);

  /* ---------------------------------------------------------
     1b) LIGHT / DARK THEME
     Script trong <head> đã đặt data-theme trước khi vẽ trang.
     Đổi chế độ → phát sự kiện "themechange" cho aurora.js và dots.js.
     --------------------------------------------------------- */
  const THEME_KEY = "bhl_portfolio_theme";
  const root = document.documentElement;
  const themeButtons = [document.getElementById("themeToggleDesktop"), document.getElementById("themeToggleMobile")].filter(Boolean);
  const themeLabels = document.querySelectorAll("[data-theme-label]");
  let currentTheme = root.getAttribute("data-theme") === "light" ? "light" : "dark";

  function updateThemeLabels() {
    const dict = I18N[currentLang] || I18N.vi;
    const toLight = currentTheme === "dark";
    themeButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(!toLight));
      btn.setAttribute("aria-label", dict[toLight ? "theme.toLight" : "theme.toDark"]);
    });
    themeLabels.forEach((label) => {
      label.textContent = dict[toLight ? "theme.labelToLight" : "theme.labelToDark"];
    });
  }

  function applyTheme(theme) {
    currentTheme = theme;
    root.setAttribute("data-theme", theme);
    updateThemeLabels();
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (_) {
      /* ignore storage restrictions */
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  function toggleTheme() {
    const next = currentTheme === "dark" ? "light" : "dark";
    // Trình duyệt hỗ trợ View Transitions → chuyển mờ dần mượt; còn lại đổi ngay
    if (document.startViewTransition && !prefersReducedMotion) {
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  }

  themeButtons.forEach((btn) => btn.addEventListener("click", toggleTheme));

  applyLanguage(currentLang);

  /* ---------------------------------------------------------
     2) MOBILE MENU (≤720px)
     --------------------------------------------------------- */
  const burgerBtn = document.getElementById("burgerBtn");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const mobileMenu = document.getElementById("mobileMenu");

  function setMenuOpen(open, restoreFocus) {
    if (!burgerBtn || !mobileOverlay || !mobileMenu) return;
    burgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
    mobileOverlay.hidden = !open;
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (!open && restoreFocus) burgerBtn.focus();
  }

  if (burgerBtn) {
    burgerBtn.addEventListener("click", () => {
      setMenuOpen(burgerBtn.getAttribute("aria-expanded") !== "true", false);
    });
  }
  if (mobileOverlay) mobileOverlay.addEventListener("click", () => setMenuOpen(false, false));
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false, false));
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerBtn && burgerBtn.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false, true);
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && burgerBtn && burgerBtn.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false, false);
    }
  });

  /* ---------------------------------------------------------
     3) ACTIVE SECTION TRACKING & SCROLL REVEAL (incl. staggered groups)
     --------------------------------------------------------- */
  const navLinks = document.querySelectorAll("[data-section]");
  const trackedSections = document.querySelectorAll("main > section[id]");

  function setActiveSection(id) {
    // the AI section has no nav item of its own — keep "Expertise" highlighted there
    const navId = id === "ai" ? "expertise" : id;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-section") === navId);
    });
  }

  // give every child of a stagger group its index → CSS delays it a little more
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  const revealTargets = document.querySelectorAll(".reveal-on-scroll, .reveal-group");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: 0 }
    );
    trackedSections.forEach((sec) => sectionObserver.observe(sec));

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((item) => revealObserver.observe(item));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     4) SCROLL-LINKED EFFECTS (one rAF per frame at most)
        - top progress bar
        - frosted band behind the nav once scrolled
        - hero gently drifts up as you scroll past it
        - text dims ONLY while it scrolls up under the nav; text still in the
          reading area keeps full brightness (the aurora background dims on its own)
     --------------------------------------------------------- */
  const siteHeader = document.querySelector(".site-header");
  const progressBar = document.getElementById("scrollProgress");
  const heroSection = document.getElementById("home");

  // Small text-level blocks, so each line dims on its own as it reaches the top.
  // Opacity is set with !important only while dimming: that beats the entrance
  // animations without disturbing them, and is removed again once back in view.
  const FADE_SELECTOR = [
    ".hero > *",
    ".hero-facts > *",
    ".section-header > *",
    ".about-photo",
    ".about-body > *",
    ".contact-info > *",
    ".contact-form > *",
  ].join(",");
  const fadeEls = Array.from(document.querySelectorAll(FADE_SELECTOR));
  const FADE_MIN = 0.15; // how dim text gets once it has passed under the nav
  const dimmed = new Map(); // phần tử đang mờ → độ mờ đã ghi

  function fadeLine() {
    // bottom edge of the nav (+ a little air) — text starts dimming when it reaches it
    return siteHeader ? siteHeader.getBoundingClientRect().bottom + 6 : 90;
  }

  let ticking = false;
  // Giá trị đã ghi lần trước: chỉ ghi lại khi đổi → không bắt trình duyệt tính lại style vô ích
  let lastProgress = "";
  let lastHeroP = "";
  let lastScrolled = null;
  function onScrollFrame() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    const progress = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    if (progressBar && progress !== lastProgress) {
      progressBar.style.transform = progress;
      lastProgress = progress;
    }
    const scrolled = y > 24;
    if (siteHeader && scrolled !== lastScrolled) {
      siteHeader.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
    if (heroSection && !prefersReducedMotion) {
      const heroP = Math.min(1, y / (vh * 0.9)).toFixed(4);
      if (heroP !== lastHeroP) {
        heroSection.style.setProperty("--hero-p", heroP);
        lastHeroP = heroP;
      }
    }

    // read all positions first, then write (avoids layout thrashing)
    const z = fadeLine();
    const updates = [];
    fadeEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      const p = Math.min(1, Math.max(0, (z - r.top) / r.height)); // 0 = below the nav, 1 = fully passed
      if (p > 0) {
        const o = (1 - (1 - FADE_MIN) * p).toFixed(3);
        if (dimmed.get(el) !== o) updates.push([el, o]);
      } else if (dimmed.has(el)) updates.push([el, null]);
    });
    updates.forEach(([el, o]) => {
      if (o === null) {
        el.style.removeProperty("opacity");
        dimmed.delete(el);
      } else {
        el.style.setProperty("opacity", o, "important");
        dimmed.set(el, o);
      }
    });

    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", onScrollFrame);
  onScrollFrame();

  /* ---------------------------------------------------------
     5) COPY EMAIL & CONTACT FORM
     --------------------------------------------------------- */
  const copyBtn = document.getElementById("copyEmailBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(EMAIL).then(() => {
        copyBtn.textContent = (I18N[currentLang] || I18N.vi)["contact.copied"];
        window.setTimeout(() => {
          copyBtn.textContent = (I18N[currentLang] || I18N.vi)["contact.copy"];
        }, 1800);
      });
    });
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm && formStatus) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const dict = I18N[currentLang] || I18N.vi;
      const nameVal = (document.getElementById("senderName").value || "").trim();
      const emailVal = (document.getElementById("senderEmail").value || "").trim();
      const msgVal = (document.getElementById("senderMessage").value || "").trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

      if (!nameVal || !emailOk || !msgVal) {
        formStatus.textContent = dict["contact.errInvalid"];
        formStatus.classList.add("is-error");
        return;
      }

      formStatus.classList.remove("is-error");
      formStatus.textContent = dict["contact.sentOk"];

      const subject = encodeURIComponent(`[Portfolio] ${nameVal}`);
      const body = encodeURIComponent(`${nameVal} <${emailVal}>\n\n${msgVal}`);
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      contactForm.reset();
    });
  }
})();
