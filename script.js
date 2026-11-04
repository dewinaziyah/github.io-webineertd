/**
 * ============================================================================
 * TEDHAK SITEN DIGITAL INVITATION
 * Logic: Vanilla JavaScript (No Frameworks, No External Dependencies)
 * Clean, Modular, Secure, Accessible & Mobile-First
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION DATA (MUDAH DIUBAH / DIKEMBANGKAN)
     ========================================================================== */
  const INVITATION_CONFIG = {
    childFullName: 'Raden Raka Daniswara Prasetyo',
    childNickName: 'Raka',
    fatherName: 'Danang Prasetyo',
    motherName: 'Sekar Ayu Paramitha',
    // Target Tanggal Acara: Format ISO 8601 (Tahun-Bulan-HariTHari:Menit:Detik+Timezone)
    eventDateISO: '2026-11-15T09:00:00+07:00',
    eventTitle: 'Tedhak Siten Ananda Raka',
    eventVenue: 'Joglo Kencana Heritage Garden, Sleman, Yogyakarta',
    eventDescription: 'Upacara Adat Tedhak Siten / Pitonan Ananda Raden Raka Daniswara Prasetyo'
  };

  /* Default initial sample greetings (Buku Tamu Doa & Ucapan) */
  const INITIAL_WISHES = [
    {
      author: 'Eyang Kakung & Eyang Putri',
      time: 'Baru saja',
      message: 'Sugeng nindakaken upacara tedhak siten kagem putu kinasih Raden Raka. Mugi tansah pinaringan berkah rahayu, dados lare ingkang sholeh, bekti marang tiyang sepuh, lan mikul dhuwur mendhem jero asmaning kulawarga.'
    },
    {
      author: 'Tante Maya & Om Bayu',
      time: '2 jam yang lalu',
      message: 'Selamat menapaki bumi pertiwi untuk pertama kali, jagoan kecil Mas Raka! Tumbuhlah sehat, cerdas, ceria, dan selalu membawa kebahagiaan untuk Bapak dan Ibu.'
    },
    {
      author: 'Keluarga Bpk. H. Wicaksono',
      time: '5 jam yang lalu',
      message: 'Barakallahu fiik. Turut berbahagia atas tasyakuran pitonan Ananda Raka. Semoga seluruh rangkaian prosesi adat berjalan lancar dan penuh berkah kebaikan.'
    }
  ];

  /* ==========================================================================
     2. DOM ELEMENTS CACHE
     ========================================================================== */
  const coverElement = document.getElementById('invitation-cover');
  const btnOpenInvitation = document.getElementById('btn-open-invitation');
  const bgAudio = document.getElementById('bg-audio');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');
  const countdownContainer = document.getElementById('countdown-container');
  const rsvpForm = document.getElementById('rsvp-form');
  const wishForm = document.getElementById('wish-form');
  const wishesListContainer = document.getElementById('wishes-list');
  const toastContainer = document.getElementById('toast-message');
  const lightboxModal = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close');
  const btnSaveCalendar = document.getElementById('btn-save-calendar');
  const navItems = document.querySelectorAll('.nav-item');

  let isAudioPlaying = false;
  let webAudioContext = null;
  let webAudioSynthTimer = null;

  /* ==========================================================================
     3. AUDIO SYSTEM (DUAL MODE: MP3 FILE + WEB AUDIO AMBIENT FALLBACK)
     ========================================================================== */
  /**
   * Menginisialisasi audio sintetis Gamelan Pelog via Web Audio API jika file MP3
   * tidak dapat diakses (misal saat dibuka offline tanpa web server).
   */
  function initAmbientGamelanSynth() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!webAudioContext) {
        webAudioContext = new AudioCtx();
      }
      if (webAudioContext.state === 'suspended') {
        webAudioContext.resume();
      }

      // Frekuensi nada Pelog Jawa (Hz)
      const pelogNotes = [261.63, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      let noteIndex = 0;

      function playGamelanChime() {
        if (!isAudioPlaying || !webAudioContext) return;
        const now = webAudioContext.currentTime;
        const osc = webAudioContext.createOscillator();
        const gainNode = webAudioContext.createGain();

        const freq = pelogNotes[noteIndex % pelogNotes.length];
        noteIndex = (noteIndex + 1) % pelogNotes.length;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gainNode);
        gainNode.connect(webAudioContext.destination);

        osc.start(now);
        osc.stop(now + 2.9);

        // Interval acak yang tenang khas laras pelog gamelan
        const nextTime = (Math.random() * 1.5 + 1.2) * 1000;
        webAudioSynthTimer = setTimeout(playGamelanChime, nextTime);
      }

      playGamelanChime();
    } catch (err) {
      console.warn('Web Audio synthesis not supported:', err);
    }
  }

  function playMusic() {
    isAudioPlaying = true;
    audioToggleBtn.classList.add('playing');
    audioToggleBtn.setAttribute('aria-label', 'Hentikan Musik');

    if (bgAudio && bgAudio.src) {
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Fallback ke Web Audio API synth jika audio file diblokir
          initAmbientGamelanSynth();
        });
      }
    } else {
      initAmbientGamelanSynth();
    }
  }

  function pauseMusic() {
    isAudioPlaying = false;
    audioToggleBtn.classList.remove('playing');
    audioToggleBtn.setAttribute('aria-label', 'Putar Musik');

    if (bgAudio) {
      bgAudio.pause();
    }
    if (webAudioSynthTimer) {
      clearTimeout(webAudioSynthTimer);
      webAudioSynthTimer = null;
    }
    if (webAudioContext && webAudioContext.state === 'running') {
      webAudioContext.suspend();
    }
  }

  function toggleAudio() {
    if (isAudioPlaying) {
      pauseMusic();
      showToast('Musik dijeda');
    } else {
      playMusic();
      showToast('Musik tradisional diputar');
    }
  }

  /* ==========================================================================
     4. OPENING COVER TRANSITION
     ========================================================================== */
  function openInvitation() {
    if (coverElement) {
      coverElement.classList.add('opened');
      // Membuka scrolling halaman
      document.body.style.overflow = 'auto';

      // Mulai memutar musik setelah interaksi eksplisit pengguna
      playMusic();

      // Memicu pengecekan elemen terlihat
      triggerScrollReveal();
    }
  }

  /* ==========================================================================
     5. COUNTDOWN TIMER LOGIC
     ========================================================================== */
  function initCountdown() {
    const targetTime = new Date(INVITATION_CONFIG.eventDateISO).getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        if (cdDays) cdDays.textContent = '00';
        if (cdHours) cdHours.textContent = '00';
        if (cdMinutes) cdMinutes.textContent = '00';
        if (cdSeconds) cdSeconds.textContent = '00';
        if (countdownContainer) {
          const expiredNotice = document.createElement('p');
          expiredNotice.className = 'section-subtitle';
          expiredNotice.style.fontWeight = '600';
          expiredNotice.style.color = 'var(--color-primary)';
          expiredNotice.textContent = 'Alhamdulillah, acara telah terselenggara dengan lancar.';
          countdownContainer.replaceChildren(expiredNotice);
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
      if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
      if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ==========================================================================
     6. INTERSECTION OBSERVER (SCROLL REVEAL & NAVIGATION SPY)
     ========================================================================== */
  function triggerScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll:not(.revealed)');
    reveals.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9) {
        el.classList.add('revealed');
      }
    });
  }

  function initScrollObservers() {
    // Reveal On Scroll Observer
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
        revealObserver.observe(el);
      });

      // Bottom Navigation Active State Observer
      const sections = document.querySelectorAll('header, section, footer');
      const navObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('id');
              if (id) {
                navItems.forEach(function (navLink) {
                  const href = navLink.getAttribute('href');
                  if (href === '#' + id) {
                    navLink.classList.add('active');
                  } else {
                    navLink.classList.remove('active');
                  }
                });
              }
            }
          });
        },
        { threshold: 0.4 }
      );

      sections.forEach(function (section) {
        navObserver.observe(section);
      });
    } else {
      // Fallback jika browser lawas tidak mendukung IntersectionObserver
      document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
        el.classList.add('revealed');
      });
    }
  }

  /* ==========================================================================
     7. LIGHTBOX GALLERY SYSTEM (MODAL & ACCESSIBILITY)
     ========================================================================== */
  function openLightbox(fullSrc, captionText) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = fullSrc;
    lightboxImg.alt = captionText || 'Pratinjau Foto';
    if (lightboxCaption) {
      lightboxCaption.textContent = captionText || '';
    }
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    if (lightboxImg) {
      lightboxImg.src = '';
    }
  }

  function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(function (item) {
      function handleClick() {
        const fullSrc = item.getAttribute('data-full');
        const caption = item.getAttribute('data-caption');
        if (fullSrc) {
          openLightbox(fullSrc, caption);
        }
      }

      item.addEventListener('click', handleClick);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      });
    });

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }

    if (lightboxModal) {
      lightboxModal.addEventListener('click', function (e) {
        if (e.target === lightboxModal) {
          closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  /* ==========================================================================
     8. CUSTOM TOAST NOTIFICATION (AMAN DARI XSS & NON-BLOCKING)
     ========================================================================== */
  let toastTimer = null;
  function showToast(message) {
    if (!toastContainer) return;
    toastContainer.textContent = message;
    toastContainer.classList.add('show');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function () {
      toastContainer.classList.remove('show');
    }, 4000);
  }

  /* ==========================================================================
     9. RSVP FORM SUBMISSION (FRONTEND VALIDATION & FEEDBACK)
     ========================================================================== */
  function initRsvpForm() {
    if (!rsvpForm) return;

    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameInput = document.getElementById('rsvp-name');
      const guestsSelect = document.getElementById('rsvp-guests');
      const statusInput = document.querySelector('input[name="rsvp-status"]:checked');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const guestsVal = guestsSelect ? guestsSelect.value : '1';
      const statusVal = statusInput ? statusInput.value : 'Hadir';

      if (!nameVal) {
        showToast('Mohon cantumkan nama lengkap Anda.');
        if (nameInput) nameInput.focus();
        return;
      }

      // Simpan riwayat konfirmasi ke localStorage (aman & persistif di browser lokal)
      try {
        const rsvpData = {
          name: nameVal,
          guests: guestsVal,
          status: statusVal,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('tedhak_siten_rsvp_user', JSON.stringify(rsvpData));
      } catch (err) {
        console.warn('LocalStorage is not available:', err);
      }

      const statusText = statusVal === 'Hadir' ? 'Hadir (' + guestsVal + ' tamu)' : 'Tidak dapat hadir';
      showToast('Matur nuwun sanget, ' + nameVal + '! Konfirmasi Anda: "' + statusText + '" telah kami catat.');

      // Reset form input
      rsvpForm.reset();
    });
  }

  /* ==========================================================================
     10. UCAPAN & DOA (BUKU TAMU - SECURE DOM MANIPULATION)
     ========================================================================== */
  function renderWishItem(wishData) {
    // PENTING (SECURE CODING): Tidak menggunakan innerHTML demi keamanan XSS
    const item = document.createElement('div');
    item.className = 'wish-item';

    const header = document.createElement('div');
    header.className = 'wish-header';

    const author = document.createElement('span');
    author.className = 'wish-author';
    author.textContent = wishData.author;

    const time = document.createElement('span');
    time.className = 'wish-time';
    time.textContent = wishData.time;

    header.appendChild(author);
    header.appendChild(time);

    const message = document.createElement('p');
    message.className = 'wish-text';
    message.textContent = wishData.message;

    item.appendChild(header);
    item.appendChild(message);

    return item;
  }

  function loadWishes() {
    if (!wishesListContainer) return;

    let savedWishes = [];
    try {
      const stored = localStorage.getItem('tedhak_siten_wishes');
      if (stored) {
        savedWishes = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    const allWishes = savedWishes.length > 0 ? savedWishes : INITIAL_WISHES;
    wishesListContainer.replaceChildren();

    allWishes.forEach(function (wish) {
      const el = renderWishItem(wish);
      wishesListContainer.appendChild(el);
    });
  }

  function initWishForm() {
    if (!wishForm) return;

    wishForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const authorInput = document.getElementById('wish-author');
      const messageInput = document.getElementById('wish-message');

      const authorVal = authorInput ? authorInput.value.trim() : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      if (!authorVal || !messageVal) {
        showToast('Mohon isi nama dan doa restu Anda.');
        return;
      }

      const newWish = {
        author: authorVal,
        message: messageVal,
        time: 'Baru saja'
      };

      // Tambahkan item baru ke DOM secara instan di posisi teratas
      if (wishesListContainer) {
        const newEl = renderWishItem(newWish);
        wishesListContainer.insertBefore(newEl, wishesListContainer.firstChild);
      }

      // Simpan ke localStorage
      try {
        let currentList = [];
        const stored = localStorage.getItem('tedhak_siten_wishes');
        if (stored) {
          currentList = JSON.parse(stored);
        } else {
          currentList = [...INITIAL_WISHES];
        }
        currentList.unshift(newWish);
        localStorage.setItem('tedhak_siten_wishes', JSON.stringify(currentList));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      showToast('Matur nuwun atas doa dan restu yang tulus untuk Ananda Raka.');
      wishForm.reset();
    });
  }

  /* ==========================================================================
     11. SIMPAN KE KALENDER (GENERASI FILE .ICS OFFLINE)
     ========================================================================== */
  function initCalendarDownload() {
    if (!btnSaveCalendar) return;

    btnSaveCalendar.addEventListener('click', function () {
      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Tedhak Siten Ananda Raka//ID',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'SUMMARY:Tedhak Siten Ananda Raden Raka Daniswara Prasetyo',
        'DESCRIPTION:Upacara Adat Tradisional Tedhak Siten / Pitonan Ananda Raka.',
        'LOCATION:Joglo Kencana Heritage Garden, Jl. Kaliurang KM 9.5, Sleman, Yogyakarta',
        'DTSTART:20261115T020000Z', // 09:00 WIB = 02:00 UTC
        'DTEND:20261115T050000Z',   // 12:00 WIB = 05:00 UTC
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.setAttribute('download', 'tedhak-siten-raka.ics');
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(downloadUrl);

      showToast('Jadwal acara berhasil diunduh ke kalender Anda.');
    });
  }

  /* ==========================================================================
     12. INITIALIZATION ON DOM READY
     ========================================================================== */
  function initApp() {
    // Cegah scroll saat cover masih terbuka
    if (coverElement && !coverElement.classList.contains('opened')) {
      document.body.style.overflow = 'hidden';
    }

    if (btnOpenInvitation) {
      btnOpenInvitation.addEventListener('click', openInvitation);
    }

    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', toggleAudio);
    }

    initCountdown();
    initScrollObservers();
    initGallery();
    initRsvpForm();
    initWishForm();
    loadWishes();
    initCalendarDownload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
