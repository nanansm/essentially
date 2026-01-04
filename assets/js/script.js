(() => {
  // ====== CONFIG DATA ======
  const EVENT = {
    title: "The Wedding of Nanan & Rindhy",
    // 20 Jan 2026 08:00 WIB (UTC+7)
    startISO: "2026-01-20T08:00:00+07:00",
    endISO:   "2026-01-20T11:00:00+07:00", // estimasi 2 jam (boleh ganti)
    locationName: "Kediaman mempelai wanita",
    address: "Kp. Sirnasari RT 001/008 Kel. Maripari, Kec. Sukawening, Kab. Garut 44179",
    whatsappNumber: "6287708789928" // TODO: ganti nomor admin / keluarga
  };

  // ====== UTIL ======
  const $ = (sel, root=document) => root.querySelector(sel);

  function pad2(n){ return String(n).padStart(2, "0"); }

  function toGCalDate(iso){
    // Google Calendar expects: YYYYMMDDTHHMMSSZ for UTC
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = pad2(d.getUTCMonth() + 1);
    const dd = pad2(d.getUTCDate());
    const hh = pad2(d.getUTCHours());
    const mi = pad2(d.getUTCMinutes());
    const ss = pad2(d.getUTCSeconds());
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
  }

  function buildGCalLink(){
    const start = toGCalDate(EVENT.startISO);
    const end = toGCalDate(EVENT.endISO);
    const text = encodeURIComponent(EVENT.title);
    const details = encodeURIComponent("Undangan pernikahan — Essentially Ours.");
    const location = encodeURIComponent(`${EVENT.locationName}, ${EVENT.address}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
  }

  function buildMapsLink(){
    const q = encodeURIComponent(`${EVENT.locationName}, ${EVENT.address}`);
    return `https://maps.app.goo.gl/BbjvmJyJjGiJsVKh6`;
  }

  function buildMapsEmbed(){
    const q = encodeURIComponent(`${EVENT.locationName}, ${EVENT.address}`);
    // Embed tanpa API key (works for simple queries)
    return `https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d6741.499903813476!2d107.98692486447158!3d-7.138482251077392!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zN8KwMDgnMTYuOSJTIDEwN8KwNTknMTcuMyJF!5e0!3m2!1sid!2sid!4v1767502575206!5m2!1sid!2sid`;
    
  }

  function getGuestName(){
    const url = new URL(window.location.href);
    // dukung ?to=Nama Tamu atau ?guest=Nama
    return (url.searchParams.get("to") || url.searchParams.get("guest") || "").trim();
  }

  // ====== SCROLL PROGRESS ======
  const scrollBar = $("#scrollBar");
  function onScroll(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (scrollBar) scrollBar.style.width = `${p}%`;
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  // ====== REVEAL ON VIEW ======
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting) e.target.classList.add("is-visible");
    }
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // ====== PERSONALIZED GUEST LINE ======
  const guestName = getGuestName();
  const guestLine = $("#guestLine");
  if (guestLine){
    if (guestName){
      guestLine.textContent = `Kepada Yth. ${guestName},`;
    } else {
      guestLine.textContent = "Dengan hormat, kami mengundang Anda untuk hadir.";
    }
  }

  // ====== COUNTDOWN ======
  const cdDays = $("#cdDays");
  const cdHours = $("#cdHours");
  const cdMins = $("#cdMins");
  const cdSecs = $("#cdSecs");

  const target = new Date(EVENT.startISO).getTime();

  function tick(){
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000*60*60*24));
    diff -= days * (1000*60*60*24);

    const hours = Math.floor(diff / (1000*60*60));
    diff -= hours * (1000*60*60);

    const mins = Math.floor(diff / (1000*60));
    diff -= mins * (1000*60);

    const secs = Math.floor(diff / 1000);

    if (cdDays) cdDays.textContent = days;
    if (cdHours) cdHours.textContent = pad2(hours);
    if (cdMins) cdMins.textContent = pad2(mins);
    if (cdSecs) cdSecs.textContent = pad2(secs);
  }
  tick();
  setInterval(tick, 1000);

  // ====== MAPS, COPY, CALENDAR ======
  const btnMaps = $("#btnMaps");
  const btnCopy = $("#btnCopy");
  const mapFrame = $("#mapFrame");
  const btnAddCal = $("#btnAddCal");

  if (btnMaps) btnMaps.href = buildMapsLink();
  if (mapFrame) mapFrame.src = buildMapsEmbed();
  if (btnAddCal) btnAddCal.href = buildGCalLink();

  if (btnCopy){
    btnCopy.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(EVENT.address);
        btnCopy.textContent = "Copied ✓";
        setTimeout(() => (btnCopy.textContent = "Copy"), 1200);
      }catch{
        alert("Gagal copy. Silakan salin manual alamatnya ya.");
      }
    });
  }

  // ====== RSVP (WA deep link) ======
  const rsvpForm = $("#rsvpForm");
  const btnSaveLocal = $("#btnSaveLocal");

  function buildWAMessage({ name, attend, notes }){
    const lines = [
      `Halo, saya ${name}.`,
      `Konfirmasi RSVP: ${attend} untuk The Wedding of Nanan & Rindhy (20 Januari 2026, 08.00 WIB).`
    ];
    if (notes) lines.push(`Catatan: ${notes}`);
    if (guestName) lines.push(`(Undangan untuk: ${guestName})`);
    return lines.join("\n");
  }

  function openWhatsApp(message){
    const text = encodeURIComponent(message);
    // universal link:
    // - mobile: opens WhatsApp app
    // - desktop: opens web.whatsapp.com
    const url = `https://wa.me/${EVENT.whatsappNumber}?text=${text}`;
    window.open(url, "_blank", "noopener");
  }

  function saveLocal(data){
    const key = "wedding_rsvp_local";
    const payload = {
      ...data,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  // prefill from local storage
  try{
    const raw = localStorage.getItem("wedding_rsvp_local");
    if (raw){
      const data = JSON.parse(raw);
      if ($("#rsvpName") && data.name) $("#rsvpName").value = data.name;
      if ($("#rsvpAttend") && data.attend) $("#rsvpAttend").value = data.attend;
      if ($("#rsvpNotes") && data.notes) $("#rsvpNotes").value = data.notes;
    }
  }catch{}

  if (btnSaveLocal){
    btnSaveLocal.addEventListener("click", () => {
      const data = {
        name: $("#rsvpName")?.value?.trim() || "",
        attend: $("#rsvpAttend")?.value || "",
        notes: $("#rsvpNotes")?.value?.trim() || ""
      };
      if (!data.name || !data.attend){
        alert("Isi minimal Nama dan Kehadiran ya 🙂");
        return;
      }
      saveLocal(data);
      btnSaveLocal.textContent = "Tersimpan ✓";
      setTimeout(() => (btnSaveLocal.textContent = "Simpan lokal"), 1200);
    });
  }

  if (rsvpForm){
    rsvpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        name: $("#rsvpName").value.trim(),
        attend: $("#rsvpAttend").value,
        notes: $("#rsvpNotes").value.trim()
      };

      if (!data.name || !data.attend){
        alert("Isi minimal Nama dan Kehadiran ya 🙂");
        return;
      }

      saveLocal(data);
      const msg = buildWAMessage(data);
      openWhatsApp(msg);
    });
  }

  // ====== MUSIC TOGGLE (optional) ======
  const audio = $("#bgm");
  const btnMusic = $("#btnMusic");

  if (btnMusic && audio){
    btnMusic.addEventListener("click", async () => {
      const isOn = btnMusic.getAttribute("aria-pressed") === "true";
      try{
        if (isOn){
          audio.pause();
          btnMusic.setAttribute("aria-pressed", "false");
          btnMusic.textContent = "♪";
        }else{
          // only works if there is a valid source
          await audio.play();
          btnMusic.setAttribute("aria-pressed", "true");
          btnMusic.textContent = "⏸";
        }
      }catch{
        alert("Audio belum tersedia / browser memblokir autoplay. Jika mau, isi file bgm.mp3 dan coba lagi.");
      }
    });
  }
})();
