
const API_URL = "https://api.aladhan.com/v1";

// ===== CALENDAR =====
const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const DAYS_AR = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];

let calCurrent = new Date();
let calSelected = null;

function pad(n) {
    return String(n).padStart(2, '0');
}

function fmtDate(d) {
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function renderCal() {

    const y = calCurrent.getFullYear();
    const m = calCurrent.getMonth();

    const today = new Date();

    const style = getComputedStyle(document.body);

    const accent = style.getPropertyValue('--az-accent').trim();
    const text = style.getPropertyValue('--az-text').trim();
    const muted = style.getPropertyValue('--az-muted').trim();

    let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">

        <button onclick="calNav(1)"
            style="background:none;border:none;cursor:pointer;font-size:18px;color:${text}">
            ‹
        </button>

        <div style="display:flex;gap:6px;align-items:center">

            <select onchange="calCurrent.setMonth(this.value);renderCal()"
                style="background:var(--az-input);color:${text};
                border:1px solid var(--az-border);
                border-radius:8px;padding:4px 6px;font-size:13px">

                ${MONTHS_AR.map((mo, i) => `
                    <option value="${i}" ${i === m ? 'selected' : ''}>
                        ${mo}
                    </option>
                `).join('')}

            </select>

            <select onchange="calCurrent.setFullYear(this.value);renderCal()"
                style="background:var(--az-input);color:${text};
                border:1px solid var(--az-border);
                border-radius:8px;padding:4px 6px;font-size:13px">

                ${Array.from({ length: 10 }, (_, i) => y - 5 + i).map(yr => `
                    <option value="${yr}" ${yr === y ? 'selected' : ''}>
                        ${yr}
                    </option>
                `).join('')}

            </select>

        </div>

        <button onclick="calNav(-1)"
            style="background:none;border:none;cursor:pointer;font-size:18px;color:${text}">
            ›
        </button>

    </div>

    <div style="display:grid;grid-template-columns:repeat(7,minmax(10px,1fr));
gap:8px;
padding:10px;
font-size:16px;
min-width:40px;text-align:center">
    `;

    DAYS_AR.forEach((d, i) => {

        const isWeekend = (i === 5 || i === 6);

        html += `
        <div style="
            font-size:11px;
            color:${isWeekend ? accent : muted};
            padding:4px">
            ${d}
        </div>
        `;
    });

    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
        html += `<div></div>`;
    }

    for (let d = 1; d <= days; d++) {

        const isToday =
            today.getDate() === d &&
            today.getMonth() === m &&
            today.getFullYear() === y;

        const isSel =
            calSelected &&
            calSelected.getDate() === d &&
            calSelected.getMonth() === m &&
            calSelected.getFullYear() === y;

        const bg = isSel ? accent : 'transparent';

        const color = isSel ? 'white' : text;

        html += `
        <div onclick="pickDay(${d})"
            style="
            padding:6px;
            border-radius:8px;
            cursor:pointer;
            background:${bg};
            color:${color};
            text-align:center">

            ${d}

        </div>
        `;
    }

    html += `</div>`;

    document.getElementById('calDropdown').innerHTML = html;
}

function calNav(dir) {
    calCurrent.setMonth(calCurrent.getMonth() + dir);
    renderCal();
}

function pickDay(d) {

    calSelected = new Date(
        calCurrent.getFullYear(),
        calCurrent.getMonth(),
        d
    );

    document.getElementById('date').value = fmtDate(calSelected);

    toggleCal();
}

function toggleCal() {

    const drop = document.getElementById('calDropdown');

    const isOpen = drop.style.display === 'block';

    drop.style.display = isOpen ? 'none' : 'block';

    if (!isOpen) {
        renderCal();
    }
}

document.addEventListener('click', e => {

    if (!e.target.closest('#calDropdown') && e.target.id !== 'date') {
        document.getElementById('calDropdown').style.display = 'none';
    }
});

// ===== FETCH =====

const fetchApi = async () => {

    const date = document.getElementById("date").value;
    const city = document.getElementById("city").value;
    const country = document.getElementById("country").value;

    const result = document.getElementById("result");
    const fetchBtn = document.getElementById("fetchBtn");

    if (!date || !city || !country) {

        alert("يرجى ملء جميع الحقول");

        return;
    }

    try {

        fetchBtn.disabled = true;

        result.innerHTML = `
        <div class="az-date-bar">
            <span class="az-spinner"></span>
            جاري التحميل...
        </div>
        `;

        const res = await fetch(
            `${API_URL}/timingsByCity/${date}?city=${city}&country=${country}`
        );

        const data = await res.json();

        if (data.code !== 200) {

            result.innerHTML = `
            <div class="az-error">
                المدينة غير صحيحة
            </div>
            `;

            return;
        }

        const timings = data.data.timings;

        const main = [
            "Fajr",
            "Dhuhr",
            "Asr",
            "Maghrib",
            "Isha"
        ];

        let html = `
        <div class="az-date-bar">
            ${date} - ${city}
        </div>

        <div class="next-box" id="nextPrayerBox">
        </div>

        <div class="az-grid">
        `;

        for (let key of main) {

            html += `
            <div class="az-pcard">

                <div class="az-pname">
                    ${key}
                </div>

                <div class="az-ptime">
                    ${timings[key]}
                </div>

            </div>
            `;
        }

        html += `</div>`;

        result.innerHTML = html;

        // تشغيل الصلاة التالية
        showNextPrayer(timings, date);

    } catch (error) {

        console.log(error);

        result.innerHTML = `
        <div class="az-error">
            حدث خطأ أثناء جلب البيانات
        </div>
        `;
    } finally {

        fetchBtn.disabled = false;
    }
};

// ===== NEXT PRAYER =====

const PRAYER_NAMES_AR = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
};

let nextPrayerInterval = null;

function parseTimeStringToDate(baseDate, timeStr) {

    const clean = timeStr.split(' ')[0];

    const [hh, mm] = clean.split(':');

    return new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hh,
        mm,
        0,
        0
    );
}

function getDateFromDMY(dmy) {

    const [dd, mm, yyyy] = dmy.split('-');

    return new Date(yyyy, mm - 1, dd);
}

function getNextPrayer(timings, dateStr) {

    const base = getDateFromDMY(dateStr);

    const now = new Date();

    const order = [
        "Fajr",
        "Dhuhr",
        "Asr",
        "Maghrib",
        "Isha"
    ];

    for (let key of order) {

        const prayerDate =
            parseTimeStringToDate(base, timings[key]);

        if (prayerDate > now) {

            return {
                key,
                time: timings[key],
                dateObj: prayerDate
            };
        }
    }

    // إذا خلصت الصلوات
    const fajrTomorrow =
        parseTimeStringToDate(base, timings.Fajr);

    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);

    return {
        key: "Fajr",
        time: timings.Fajr,
        dateObj: fajrTomorrow
    };
}

function formatCountdown(ms) {

    if (ms <= 0) return "الآن";

    const total = Math.floor(ms / 1000);

    const h = Math.floor(total / 3600);

    const m = Math.floor((total % 3600) / 60);

    const s = total % 60;

    return `${h}س ${m}د ${s}ث`;
}

function showNextPrayer(timings, dateStr) {

    const box =
        document.getElementById("nextPrayerBox");

    if (!box) return;

    clearInterval(nextPrayerInterval);

    const info =
        getNextPrayer(timings, dateStr);

    function render() {

        const now = new Date();

        const diff =
            info.dateObj.getTime() - now.getTime();

        const nameAr =
            PRAYER_NAMES_AR[info.key];

        box.innerHTML = `
        <div>
            الصلاة التالية
        </div>

        <div class="np-time">
            ${nameAr}
        </div>

        <div>
            الساعة ${info.time}
        </div>

        <div class="np-count">
            ${formatCountdown(diff)}
        </div>
        `;
    }

    render();

    nextPrayerInterval =
        setInterval(render, 1000);
}

// ===== THEME =====

function toggleTheme() {

    const body = document.body;

    const themeIcon =
        document.getElementById("themeIcon");

    const appIcon =
        document.getElementById("appIcon");

    const themeLabel =
        document.getElementById("themeLabel");

    body.classList.toggle("dark");
    body.classList.toggle("light");

    if (body.classList.contains("dark")) {

        themeIcon.className = "ti ti-moon";

        appIcon.className =
            "ti ti-moon-stars";

        themeLabel.textContent = "ليلي";

    } else {

        themeIcon.className = "ti ti-sun";

        appIcon.className = "ti ti-sun";

        themeLabel.textContent = "نهاري";
    }
}

