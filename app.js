// === ??   (      ) ===
const CONFIG = {
    // Себестоимость билета (для расчета маржинальности и чистой прибыли) теперь берется динамически из свойства 'net' в tariffs
    // 1.  (  )
    tariffs: {
        day: [
            { start: '05-23', end: '05-31', tourist: { ADL: 11100, CHLD: 8860 }, agent: { ADL: 10900, CHLD: 8660 }, net: { ADL: 10200, CHLD: 8160 } },
            { start: '06-01', end: '08-23', tourist: { ADL: 14000, CHLD: 11500 }, agent: { ADL: 13450, CHLD: 10700 }, net: { ADL: 12750, CHLD: 10200 } },
            { start: '08-24', end: '09-06', tourist: { ADL: 11500, CHLD: 9200 }, agent: { ADL: 11200, CHLD: 8860 }, net: { ADL: 10200, CHLD: 8160 } },
            { start: '09-07', end: '09-20', tourist: { ADL: 9500, CHLD: 7500 }, agent: { ADL: 9200, CHLD: 7300 }, net: { ADL: 8500, CHLD: 6800 } },
            { start: '09-21', end: '09-30', tourist: { ADL: 8500, CHLD: 6700 }, agent: { ADL: 8350, CHLD: 6520 }, net: { ADL: 7650, CHLD: 6120 } },
        ],
        evening: [
            { start: '06-01', end: '08-31', tourist: { ADL: 9500, CHLD: 7500 }, agent: { ADL: 9000, CHLD: 7180 }, net: { ADL: 8500, CHLD: 6800 } }
        ]
    },
    // 2. Скидки (в процентах)
    discounts: {
        earlyBooking: 15, // Акция: раннее бронирование
        pensioner: 50,    // Пенсионеры
        birthday: 100,    // Именинники
        disabled: 100     // Инвалидность
    },
    // 3.  (  )
    credentials: {
        'admin': 'tetys2026',
        'manager': '0606'
    },
    // 4. Промокоды
    promocodes: {
        'SUMMER10': { type: 'percent', value: 10 },
        'TETYS2000': { type: 'fixed', value: 2000 }
    },
    // 5. Настройки Telegram (уведомления)
    telegram: {
        token: '8326452253:AAGkZdUQSysj3ItCePnPxcD6qXh_05Mjnmk',
        chatId: '673284304',
        minSumForAlert: 50000 // Минимальная сумма для уведомления (например, 50 000 ₸)
    }
};
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed', err));
    }

    // Вспомогательная функция для всплывающих уведомлений (Toast)
    window.showToast = function(message, icon = '', bgColor = 'bg-blue-600') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg transition-all duration-300 transform translate-y-5 opacity-0 ${bgColor}`;
        toast.style.minWidth = '280px';
        toast.style.maxWidth = '400px';
        
        let iconHtml = '';
        if (icon) {
            if (icon.startsWith('fa-')) {
                iconHtml = `<i class="fa-solid ${icon}"></i>`;
            } else {
                iconHtml = icon;
            }
        }
        
        toast.innerHTML = `
            ${iconHtml ? `<div class="text-lg">${iconHtml}</div>` : ''}
            <div class="flex-1 font-sans text-sm">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Trigger reflow
        toast.offsetHeight;
        
        // Animate in
        toast.classList.remove('translate-y-5', 'opacity-0');
        
        setTimeout(() => {
            // Animate out
            toast.classList.add('-translate-y-5', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    };

    // --- АВТОРИЗАЦИЯ ---
    const authScreen = document.getElementById('authScreen');
    const appContent = document.getElementById('appContent');
    const authLogin = document.getElementById('authLogin');
    const authPin = document.getElementById('authPin');
    const authBtn = document.getElementById('authBtn');
    const authError = document.getElementById('authError');
    const authFormBody = document.getElementById('authFormBody');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- ПОИСК ПО ГОСТЯМ ---
    window.filterGuests = function(query) {
        query = query.toLowerCase().trim();
        const list = document.getElementById('touristList');
        if (!list) return;
        const rows = list.querySelectorAll('.tourist-row');
        rows.forEach(row => {
            const nameInput = row.querySelector('input[placeholder="ФИО туриста"]');
            if (nameInput) {
                const name = nameInput.value.toLowerCase();
                if (name.includes(query) || query === '') {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    };

    // Изменили ключ, чтобы сбросить старую сессию без пароля
    if (localStorage.getItem('tetysAuthV2') === 'true') {
        authScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
    } else {
        if (authLogin) authLogin.focus();
    }

    function checkAuth() {
        const login = authLogin.value.trim().toLowerCase();
        const pass = authPin.value;
        
        if (CONFIG.credentials[login] && CONFIG.credentials[login] === pass) {
            localStorage.setItem('tetysAuthV2', 'true');
            localStorage.setItem('tetysUser', login); // Запоминаем кто вошел
            
            authScreen.style.opacity = '0';
            setTimeout(() => {
                authScreen.classList.add('hidden');
                appContent.classList.remove('hidden');
                appContent.style.animation = 'popIn 0.5s ease-out forwards';
            }, 300);
        } else {
            authError.classList.remove('hidden');
            authPin.value = '';
            
            if (authFormBody) {
                authFormBody.style.animation = 'shake 0.4s ease-in-out';
                setTimeout(() => { authFormBody.style.animation = ''; }, 400);
            }
        }
    }

    if (authBtn) {
        authBtn.addEventListener('click', checkAuth);
        authPin.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAuth(); });
        authLogin.addEventListener('keypress', (e) => { if (e.key === 'Enter') authPin.focus(); });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('tetysAuthV2');
            localStorage.removeItem('tetysUser');
            location.reload();
        });
    }
    
    if (!document.getElementById('authStyles')) {
        const style = document.createElement('style');
        style.id = 'authStyles';
        style.innerHTML = `@keyframes shake { 0%, 100% {transform: translateX(0);} 20%, 60% {transform: translateX(-10px);} 40%, 80% {transform: translateX(10px);} }`;
        document.head.appendChild(style);
    }
    // -------------------

    // Тарифы
    const tariffs = {
        day: [
            { start: '05-23', end: '05-31', tourist: { ADL: 11100, CHLD: 8860 }, agent: { ADL: 10900, CHLD: 8660 }, net: { ADL: 10200, CHLD: 8160 } },
            { start: '06-01', end: '08-23', tourist: { ADL: 14000, CHLD: 11500 }, agent: { ADL: 13450, CHLD: 10700 }, net: { ADL: 12750, CHLD: 10200 } },
            { start: '08-24', end: '09-06', tourist: { ADL: 11500, CHLD: 9200 }, agent: { ADL: 11200, CHLD: 8860 }, net: { ADL: 10200, CHLD: 8160 } },
            { start: '09-07', end: '09-20', tourist: { ADL: 9500, CHLD: 7500 }, agent: { ADL: 9200, CHLD: 7300 }, net: { ADL: 8500, CHLD: 6800 } },
            { start: '09-21', end: '09-30', tourist: { ADL: 8500, CHLD: 6700 }, agent: { ADL: 8350, CHLD: 6520 }, net: { ADL: 7650, CHLD: 6120 } },
        ],
        evening: [
            { start: '06-01', end: '08-31', tourist: { ADL: 9500, CHLD: 7500 }, agent: { ADL: 9000, CHLD: 7180 }, net: { ADL: 8500, CHLD: 6800 } }
        ]
    };

    // Транслитерация
    const cyrillicToLatinMap = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH', 'З': 'Z', 'И': 'I',
        'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
        'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
        'Э': 'E', 'Ю': 'YU', 'Я': 'YA', 'Ә': 'A', 'І': 'I', 'Ң': 'NG', 'Ғ': 'GH', 'Ү': 'U', 'Ұ': 'U', 'Қ': 'Q', 'Ө': 'O', 'Һ': 'H',
        'а': 'A', 'б': 'B', 'в': 'V', 'г': 'G', 'д': 'D', 'е': 'E', 'ё': 'E', 'ж': 'ZH', 'з': 'Z', 'и': 'I',
        'й': 'Y', 'к': 'K', 'л': 'L', 'м': 'M', 'н': 'N', 'о': 'O', 'п': 'P', 'р': 'R', 'с': 'S', 'т': 'T',
        'у': 'U', 'ф': 'F', 'х': 'KH', 'ц': 'TS', 'ч': 'CH', 'ш': 'SH', 'щ': 'SHCH', 'ъ': '', 'ы': 'Y', 'ь': '',
        'э': 'E', 'ю': 'YU', 'я': 'YA', 'ә': 'A', 'і': 'I', 'ң': 'NG', 'ғ': 'GH', 'ү': 'U', 'ұ': 'U', 'қ': 'Q', 'ө': 'O', 'һ': 'H'
    };

    function transliterate(text) {
        if (!text) return '';
        return text.split('').map(char => cyrillicToLatinMap[char] !== undefined ? cyrillicToLatinMap[char] : char.toUpperCase()).join('');
    }

    // Состояние приложения

    let tourists = [];
    let currentCalcMode = 'detailed';
    let quickCounts = { adl: 0, chld: 0, pens: 0, inf: 0, inv: 0, inv2: 0, inv3: 0, chld_inv: 0 };
    
    // Элементы DOM
    const visitDateInput = document.getElementById('visitDate');
    const clientTypeInput = document.getElementById('clientType');
    const tariffTypeInput = document.getElementById('tariffType');
    const dateWarning = document.getElementById('dateWarning');
    const touristListEl = document.getElementById('touristList');
    const addTouristBtn = document.getElementById('addTouristBtn');
    const parseBulkBtn = document.getElementById('parseBulkBtn');

    const bulkText = document.getElementById('bulkText');
    const emptyState = document.getElementById('emptyState');
    const totalPriceEl = document.getElementById('totalPrice');
    const exportDataEl = document.getElementById('exportData');
    const copyExportBtn = document.getElementById('copyExportBtn');
    const promoInput = document.getElementById('promoInput');
    const commentInput = document.getElementById('commentInput');

    // Слушатели для промокода
    if (promoInput) {
        promoInput.addEventListener('input', () => {
            render(); // Пересчет при изменении промокода
        });
    }
    if (commentInput) {
        commentInput.addEventListener('input', () => {
            saveDraft();
        });
    }

    // --- Цензура ---
    function sanitizeProfanity(text) {
        if (!text) return text;
        const badWords = [
            'хуй', 'хуя', 'хуе', 'нахуй', 'похуй', 'дохуя', 'пизда', 'пизде', 'пизду', 'пизды', 'пиздец', 'ебать', 'ебан', 'ебану', 'долбоеб', 'долбоёб', 'уебан', 'бля', 'блять', 'блядь', 'сука', 'суку', 'суки', 'пидор', 'пидарас', 'пидорас', 'гандон', 'шлюха', 'шлюхи', 'шалава', 'шалавы', 'шмара', 'курва', 'залупа', 'говно', 'мразь', 'ублюдок', 'чмо', 'хуесос', 'хуйло', 'педик', 'пиздюк',
            'қотақ', 'котак', 'қотағым', 'котагым', 'қотақбас', 'котакбас', 'ам', 'амы', 'сігіс', 'сигис', 'шешең', 'шешен', 'шешеңді', 'шешенди', 'көт', 'көті', 'коти', 'жалеп', 'амшык', 'амшық',
            'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut'
        ];
        let sanitized = text;
        badWords.forEach(word => {
            const regex = new RegExp('(^|[^\\p{L}])(' + word + ')($|[^\\p{L}])', 'giu');
            sanitized = sanitized.replace(regex, '$1***$3');
            sanitized = sanitized.replace(regex, '$1***$3'); // second pass for overlaps
        });
        return sanitized;
    }
    // ---------------


    // Dummy auth logic removed to prevent conflicts with checkAuth

    // Статистика
    const stats = {
        adl: document.getElementById('statAdl'),
        chld: document.getElementById('statChld'),
        inf: document.getElementById('statInf'),
        pens: document.getElementById('statPens'),
        inv: document.getElementById('statInv'),
        bday: document.getElementById('statBday')
    };

    // Устанавливаем сегодняшнюю дату по умолчанию
    const today = new Date();
    // Форматируем с учетом локальной зоны (для корректного отображения YYYY-MM-DD)
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    visitDateInput.value = todayStr;
    
    // Автоматический год сезона
    const currentSeasonYearEl = document.getElementById('currentSeasonYear');
    if (currentSeasonYearEl) {
        currentSeasonYearEl.textContent = `Сезон ${today.getFullYear()}`;
    }

    if (visitDateInput) visitDateInput.addEventListener('change', render);
    if (clientTypeInput) clientTypeInput.addEventListener('change', render);
    if (tariffTypeInput) tariffTypeInput.addEventListener('change', render);
    if (addTouristBtn) addTouristBtn.addEventListener('click', addTourist);
    
    const earlyBookingToggle = document.getElementById('earlyBookingToggle');
    const earlyBookingContainer = document.getElementById('earlyBookingContainer');
    const earlyBookingBadge = document.getElementById('earlyBookingBadge'); // Из шапки
    
    if (earlyBookingToggle) earlyBookingToggle.addEventListener('change', render);

    // Загрузка черновика (Авто-сохранение)
    const draft = localStorage.getItem('tetisBluDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            // Мы больше не загружаем сохраненную дату визита из черновика, 
            // чтобы она ВСЕГДА по умолчанию была сегодняшним днем.
            // if (data.visitDate) visitDateInput.value = data.visitDate;
            if (data.clientType) clientTypeInput.value = data.clientType;
            if (data.tariffType) tariffTypeInput.value = data.tariffType;
            if (data.tourists && Array.isArray(data.tourists) && data.tourists.length > 0) {
                tourists = data.tourists;
            } else {
                addTourist();
            }
            if (data.currentCalcMode) {
                currentCalcMode = data.currentCalcMode;
            }
            if (data.quickCounts) {
                quickCounts = data.quickCounts;
            }
            if (data.promo && promoInput) {
                promoInput.value = data.promo;
            }
            if (data.comment && commentInput) {
                commentInput.value = data.comment;
            }
            setTimeout(() => {
                switchCalcMode(currentCalcMode);
            }, 50);
        } catch (e) {
            console.error('Ошибка загрузки черновика', e);
            addTourist();
        }
    } else {
        addTourist();
    }
    
    // Первичный рендер если данные загружены
    if (tourists.length > 0) render();

    let lastAttemptedText = '';



    // Parse Bulk Text Input
    parseBulkBtn.addEventListener('click', () => {
        const text = bulkText.value.trim();
        if (!text) return;
        
        const isForced = (text === lastAttemptedText);
        lastAttemptedText = text;
        
        // Check if the input represents quantities instead of names with dates of birth
        const dobRegex = /\b(0?[1-9]|[12]\d|3[01])([\.\-\/\s])(0?[1-9]|1[0-2])\2(\d{4}|\d{2})\b|\b(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])(\d{4})\b|\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{4}|\d{2})\b/;
        
        // Function to parse quantity descriptions like "2 взрослых и 1 ребенок"
        function parseQuantityDescription(inputText) {
            if (dobRegex.test(inputText)) {
                return null; // Contains DOBs, so it's a detailed list, not just counts
            }

            const cleanText = inputText.toLowerCase();
            
            // Regex patterns to detect counts of different guest categories.
            const adlRegex = /(\d+)\s*(?:взросл[ыеяйах]*|взр|adl|adults?|ересектер?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/g;
            const infRegex = /(\d+)\s*(?:ребен[окац]*|реб|младен[ецаы]*|мл[ад]*|inf(?:ants?)?|сәби|бөбек)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/g;
            const chldRegex = /(\d+)\s*(?:дети|дет(?:и|ям|ей|ях)?|chld|child(?:ren)?|бала(?:лар)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/g;
            const snrRegex = /(\d+)\s*(?:пенсионер[ыов]*|пенс|snr|pensioners?|зейнеткер(?:лер)?|зийнеткер(?:лер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/g;
            const invRegex = /(\d+)\s*(?:инвалид[ыов]*|инв|inv|мүгедек(?:тер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/g;
            
            let adlCount = 0;
            let chldCount = 0;
            let infCount = 0;
            let snrCount = 0;
            let invCount = 0;
            
            let matched = false;
            let match;
            
            while ((match = adlRegex.exec(cleanText)) !== null) {
                adlCount += parseInt(match[1], 10);
                matched = true;
            }
            while ((match = chldRegex.exec(cleanText)) !== null) {
                chldCount += parseInt(match[1], 10);
                matched = true;
            }
            while ((match = infRegex.exec(cleanText)) !== null) {
                infCount += parseInt(match[1], 10);
                matched = true;
            }
            while ((match = snrRegex.exec(cleanText)) !== null) {
                snrCount += parseInt(match[1], 10);
                matched = true;
            }
            while ((match = invRegex.exec(cleanText)) !== null) {
                invCount += parseInt(match[1], 10);
                matched = true;
            }
            
            if (!matched) {
                // If no numbers were matched, check if there are keywords present (meaning singular, like "взрослый и ребенок" -> 1 adult, 1 child)
                const hasAdl = /(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:взросл[ыеяйах]*|взр|adl|adults?|ересектер?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/i.test(cleanText);
                const hasChld = /(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:дети|дет(?:и|ям|ей|ях)?|chld|child(?:ren)?|бала(?:лар)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/i.test(cleanText);
                const hasInf = /(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:ребен[окац]*|реб|младен[ецаы]*|мл[ад]*|inf(?:ants?)?|сәби|бөбек)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/i.test(cleanText);
                const hasSnr = /(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:пенсионер[ыов]*|пенс|snr|pensioners?|зейнеткер(?:лер)?|зийнеткер(?:лер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/i.test(cleanText);
                const hasInv = /(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:инвалид[ыов]*|инв|inv|мүгедек(?:тер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/i.test(cleanText);
                
                if (hasAdl || hasChld || hasInf || hasSnr || hasInv) {
                    if (hasAdl) adlCount = 1;
                    if (hasChld) chldCount = 1;
                    if (hasInf) infCount = 1;
                    if (hasSnr) snrCount = 1;
                    if (hasInv) invCount = 1;
                    matched = true;
                }
            }
            
            if (!matched) return null;
            
            return { adl: adlCount, chld: chldCount, inf: infCount, snr: snrCount, inv: invCount };
        }

        const quantityData = parseQuantityDescription(text);
        if (quantityData) {
            const today = new Date();
            const visitDateStr = visitDateInput ? visitDateInput.value : '';
            const visitYear = visitDateStr ? new Date(visitDateStr).getFullYear() : today.getFullYear();
            
            tourists = []; // Clear existing list
            
            // Add Adults (ADL)
            for (let i = 0; i < quantityData.adl; i++) {
                tourists.push({
                    id: createId(),
                    fullName: `Гость ${tourists.length + 1}`,
                    dob: `${visitYear - 25}-06-15`,
                    gender: 'male',
                    genderManuallySet: false,
                    disability: 'none'
                });
            }
            // Add Children (CHLD)
            for (let i = 0; i < quantityData.chld; i++) {
                tourists.push({
                    id: createId(),
                    fullName: `Гость ${tourists.length + 1}`,
                    dob: `${visitYear - 8}-06-15`,
                    gender: 'male',
                    genderManuallySet: false,
                    disability: 'none'
                });
            }
            // Add Pensioners (SNR)
            for (let i = 0; i < quantityData.snr; i++) {
                tourists.push({
                    id: createId(),
                    fullName: `Гость ${tourists.length + 1}`,
                    dob: `${visitYear - 65}-06-15`,
                    gender: 'male',
                    genderManuallySet: false,
                    disability: 'none'
                });
            }
            // Add Infants (INF)
            for (let i = 0; i < quantityData.inf; i++) {
                tourists.push({
                    id: createId(),
                    fullName: `Гость ${tourists.length + 1}`,
                    dob: `${visitYear - 1}-06-15`,
                    gender: 'male',
                    genderManuallySet: false,
                    disability: 'none'
                });
            }
            // Add Disabled (INV)
            for (let i = 0; i < quantityData.inv; i++) {
                tourists.push({
                    id: createId(),
                    fullName: `Гость ${tourists.length + 1}`,
                    dob: `${visitYear - 30}-06-15`,
                    gender: 'male',
                    genderManuallySet: false,
                    disability: '1',
                    category: 'INV',
                    categoryManuallySet: true
                });
            }
            
            render();
            bulkText.value = '';
            return;
        }

        let normalizedText = text;

        // 1. Отделяем слипшиеся цифры от букв (например "Джон15.05" -> "Джон 15.05")
        normalizedText = normalizedText.replace(/([a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(\d)/g, '$1 $2');

        // 2. Преобразование текстового возраста в цифры ("пять лет" -> "5 лет")
        const ageWordsMap = {
            'один': '1', 'два': '2', 'три': '3', 'четыре': '4', 'пять': '5', 'шесть': '6', 'семь': '7', 'восемь': '8', 'девять': '9', 'десять': '10', 'одиннадцать': '11', 'двенадцать': '12', 'тринадцать': '13', 'четырнадцать': '14', 'пятнадцать': '15', 'шестнадцать': '16', 'семнадцать': '17', 'восемнадцать': '18',
            'бір': '1', 'екі': '2', 'үш': '3', 'төрт': '4', 'бес': '5', 'алты': '6', 'жеті': '7', 'сегіз': '8', 'тоғыз': '9', 'он': '10', 'он бір': '11', 'он екі': '12',
            'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10', 'eleven': '11', 'twelve': '12'
        };
        const ageWordsRegex = new RegExp(`\\b(${Object.keys(ageWordsMap).join('|')})\\s+(?=лет|года?|жас|yo|years?(?:\\s+old)?|old\\b)`, 'gi');
        normalizedText = normalizedText.replace(ageWordsRegex, (match, p1) => `${ageWordsMap[p1.toLowerCase()]} `);

        // 3. Перевод месяцев на трех языках в числовой формат ГЛОБАЛЬНО
        const monthMapGlobal = {
            'января': '01', 'январь': '01', 'янв': '01', 'февраля': '02', 'февраль': '02', 'фев': '02', 'марта': '03', 'март': '03', 'мар': '03', 'апреля': '04', 'апрель': '04', 'апр': '04', 'мая': '05', 'май': '05', 'июня': '06', 'июнь': '06', 'июн': '06', 'июля': '07', 'июль': '07', 'июл': '07', 'августа': '08', 'август': '08', 'авг': '08', 'сентября': '09', 'сентябрь': '09', 'сен': '09', 'октября': '10', 'октябрь': '10', 'окт': '10', 'ноября': '11', 'ноябрь': '11', 'ноя': '11', 'декабря': '12', 'декабрь': '12', 'дек': '12',
            'қаңтар': '01', 'кантар': '01', 'қаң': '01', 'ақпан': '02', 'акпан': '02', 'ақп': '02', 'наурыз': '03', 'нау': '03', 'сәуір': '04', 'сэуір': '04', 'сәу': '04', 'мамыр': '05', 'мам': '05', 'маусым': '06', 'мау': '06', 'шілде': '07', 'шилде': '07', 'шіл': '07', 'тамыз': '08', 'там': '08', 'қыркүйек': '09', 'кыркуйек': '09', 'қыр': '09', 'қазан': '10', 'казан': '10', 'қаз': '10', 'қараша': '11', 'караша': '11', 'қар': '11', 'желтоқсан': '12', 'желтоксан': '12', 'жел': '12',
            'january': '01', 'jan': '01', 'february': '02', 'feb': '02', 'march': '03', 'mar': '03', 'april': '04', 'apr': '04', 'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07', 'august': '08', 'aug': '08', 'september': '09', 'sep': '09', 'october': '10', 'oct': '10', 'november': '11', 'nov': '11', 'december': '12', 'dec': '12'
        };
        const monthKeysGlobal = Object.keys(monthMapGlobal).sort((a, b) => b.length - a.length);
        const monthsRegexGlobal = new RegExp(`(\\b\\d{1,2}[\\.\\-\\s\\/\\,]+)(${monthKeysGlobal.join('|')})(?![a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])`, 'gi');
        normalizedText = normalizedText.replace(monthsRegexGlobal, (match, p1, p2) => `${p1}${monthMapGlobal[p2.toLowerCase()]}`);

        // 4. Нормализация разделителей дат: заменяем "15..05..1990" или "15 май 1990" на "15.05.1990"
        normalizedText = normalizedText.replace(/(\b(?:0?[1-9]|[12]\d|3[01]))[\.\-\/\s\,]+(0?[1-9]|1[0-2])[\.\-\/\s\,]+(\d{4}|\d{2}\b)/g, '$1.$2.$3');

        // 5. Склеиваем перенесенные на новую строку даты/возраст/категории с предыдущей строкой (именем)
        const mergeRegex = /([a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])\s*[\r\n]+\s*(?=\b(?:0?[1-9]|[12]\d|3[01])[\.\-\/\s\,](?:0?[1-9]|1[0-2])[\.\-\/\s\,](?:\d{4}|\d{2})\b|\b(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])\d{4}\b|\b(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?:\d{4}|\d{2})\b|\b\d{1,2}\s*(?:лет|года?|жас|yo)\b|\b(?:chld|adl|inf|snr|inv|взр|реб|дет|пенс|инв)\b)/gi;
        normalizedText = normalizedText.replace(mergeRegex, '$1 ');

        // 1. Предобработка: разбиваем на строки по датам рождения перед именами
        const dobSplitRegex = /(?:\b(0?[1-9]|[12]\d|3[01])([\.\-\/\s\,])(0?[1-9]|1[0-2])\2(\d{4}|\d{2})\b|\b(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])(\d{4})\b|\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{4}|\d{2})\b)([\.\s\-\/\,]+)(?=[a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/g;
        normalizedText = normalizedText.replace(dobSplitRegex, '$&\n');
        
        // 2. Убираем нумерацию строк (например, "1. ", "2) ", "3 ") в начале каждой строки
        normalizedText = normalizedText.replace(/(?:^|\n)\s*\d+[\.\)\s\-]+\s*(?=[a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\d])/g, '\n');
        
        const lines = normalizedText.split('\n');
        const unrecognizedLines = [];
        
        lines.forEach((line, index) => {
            const originalLine = line;
            line = line.trim();
            if (!line) return;

            let tAge = undefined;
            let tYear = undefined;

            // Проверяем, не заголовок ли это (дата визита)
            const headerDateMatch = line.match(/(?:на\s+|дата\s*посещения\s*|баратын\s*күніміз\s*)?(\d{1,2})[\.\-\/](\d{1,2})(?:[\.\-\/](\d{2}|\d{4}))?/i);
            const lowerLine = line.toLowerCase();
            const isHeader = headerDateMatch && (
                lowerLine.includes('на ') || 
                lowerLine.includes('дата') || 
                lowerLine.includes('тетис') ||
                lowerLine.includes('tour') ||
                lowerLine.includes('тур') ||
                lowerLine.includes('бронь') ||
                lowerLine.includes('заявка') ||
                lowerLine.includes('групп') ||
                lowerLine.includes('баратын') ||
                lowerLine.includes('күні') ||
                lowerLine.includes('куни')
            );

            // Если это явно заголовок (или первая/вторая строка с подозрением на заголовок)
            if (isHeader && (index === 0 || index === 1 || lowerLine.includes('дата') || lowerLine.includes('баратын') || lowerLine.includes('күні') || lowerLine.includes('куни'))) {
                const day = headerDateMatch[1].padStart(2, '0');
                const month = headerDateMatch[2].padStart(2, '0');
                let currentYear = new Date().getFullYear();
                
                if (headerDateMatch[3]) {
                    let y = headerDateMatch[3];
                    if (y.length === 2) {
                        const yInt = parseInt(y);
                        currentYear = yInt > 50 ? 1900 + yInt : 2000 + yInt;
                    } else {
                        currentYear = parseInt(y);
                    }
                }
                
                if (visitDateInput) {
                    visitDateInput.value = `${currentYear}-${month}-${day}`;
                    // Триггерим событие change чтобы пересчитались тарифы для новой даты
                    visitDateInput.dispatchEvent(new Event('change'));
                }
                return;
            }

            // Детекция категории из исходного текста
            let parsedCategory = null;
            const lowerLineForCat = line.toLowerCase();
            if (/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(?:adl|adults?|взросл[ыеяйах]*|взр|үлкен)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/i.test(lowerLineForCat)) {
                parsedCategory = 'ADL';
            } else if (/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(?:chld|child(?:ren)?|дети|дет[ямнска]*|бала(?:лар)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/i.test(lowerLineForCat)) {
                parsedCategory = 'CHLD';
            } else if (/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(?:inf(?:ants?)?|младен[ецаы]*|мл[ад]*|ребен[окац]*|реб|сәби|бөбек)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/i.test(lowerLineForCat)) {
                parsedCategory = 'INF';
            } else if (/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(?:snr|pensioners?|пенсионер[ыов]*|пенс|зейнеткер(?:лер)?|зийнеткер(?:лер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/i.test(lowerLineForCat)) {
                parsedCategory = 'SNR';
            } else if (/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])(?:inv|инвалид[ыов]*|инв|мүгедек(?:тер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ])/i.test(lowerLineForCat)) {
                parsedCategory = 'INV';
            }



            // Ищем дату рождения по нашему улучшенному regex (день 1-31, месяц 1-12, год 2 или 4 цифры)
            const dobRegex = /\b(0?[1-9]|[12]\d|3[01])([\.\-\/\s\,])(0?[1-9]|1[0-2])\2(\d{4}|\d{2})\b|\b(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])(\d{4})\b|\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{4}|\d{2})\b/;
            const dobMatch = line.match(dobRegex);
            
            let dobIso = '';
            let matchedStr = '';
            
            if (dobMatch) {
                matchedStr = dobMatch[0];
                const parts = matchedStr.split(/[\.\-\/\s\,]+/);
                
                let day = '';
                let month = '';
                let year = '';
                
                if (parts.length >= 3) {
                    day = parts[0].padStart(2, '0');
                    month = parts[1].padStart(2, '0');
                    year = parts[2];
                } else if (parts.length === 2) {
                    day = parts[0].padStart(2, '0');
                    // Например: "081997"
                    month = parts[1].slice(0, 2).padStart(2, '0');
                    year = parts[1].slice(2);
                } else {
                    // Нет разделителей вовсе, например "16081997" or "160897"
                    day = matchedStr.slice(0, 2);
                    month = matchedStr.slice(2, 4);
                    year = matchedStr.slice(4);
                }
                
                if (year.length === 2) {
                    const yInt = parseInt(year);
                    year = (yInt > 50 ? 1900 + yInt : 2000 + yInt).toString();
                }

                dobIso = `${year}-${month}-${day}`;
            } else {
                // Ищем указание возраста, например "35 лет", "5 жас", "12 years", "2 года"
                const ageRegex = /(?<!\d)(\d{1,2})\s*(?:лет|года|год|жаста|жас|yo|y\.o\.|years?(?:\s+old)?|old)(?![a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ0-9_])/i;
                const ageMatch = line.match(ageRegex);
                if (ageMatch) {
                    matchedStr = ageMatch[0];
                    const age = parseInt(ageMatch[1], 10);
                    dobIso = '';
                    tAge = age;
                } else {
                    // Ищем только четырехзначный год рождения, например "1995", "2018 г.", "2015 г.р."
                    const yearRegex = /(?<!\d)(19\d{2}|20[0-2]\d)(?![0-9])(?:\s*(?:г\.|г|года|г\.р\.|гр))?/i;
                    const yearMatch = line.match(yearRegex);
                    if (yearMatch) {
                        matchedStr = yearMatch[0];
                        const birthYear = parseInt(yearMatch[1], 10);
                        dobIso = '';
                        tYear = birthYear;
                    } else {
                        // Ищем просто цифру от 1 до 99 (скорее всего это возраст), даже если она слитно с именем
                        const simpleAgeRegex = /(?<!\d)(\d{1,2})(?=$|\s|,)/;
                        const simpleAgeMatch = line.match(simpleAgeRegex);
                        if (simpleAgeMatch) {
                            matchedStr = simpleAgeMatch[1]; // берем саму группу цифр
                            const age = parseInt(simpleAgeMatch[1], 10);
                            dobIso = '';
                            tAge = age;
                        }
                    }
                }
            }
            
            // Вырезаем дату/возраст/год из строки если найдено
            let namePart = line;
            if (matchedStr) {
                namePart = line.replace(matchedStr, '');
            }
            
            // Убираем указание возраста типа "(29 жас)", "29 жас", "(7 лет)", "7 лет"
            namePart = namePart.replace(/\(?\b\d+\s*(?:жас|лет|год[а-я]*|yo|y\.o\.|years?|old)(?![a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ0-9])\)?/ig, '');
            namePart = namePart.replace(/\(\s*\d+\s*\)/g, ''); // числа в круглых скобках
            
            // Убираем обращения (MR, MRS, MS, CHD, INF, ADL, SNR, INV, PAX и т.д.)
            namePart = namePart.replace(/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:mr|mrs|ms|chd|inf|adl|snr|inv|pax|adults?|pensioners?|children|infants?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/ig, ' ');
            
            // Убираем категории на трех языках
            namePart = namePart.replace(/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:взр(?:осл[а-я]*)?|реб(?:ен[окац]+)?|дети|дет(?:и|ям|ей|ях)?|млад(?:ен[а-я]*)?|пенс(?:ионер[а-я]*)?|инв(?:алид[а-я]*)?|зейнеткер(?:лер)?|зийнеткер(?:лер)?|мүгедек(?:тер)?|бала(?:лар)?|үлкен(?:дер)?)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/ig, ' ');
            
            // Убираем CRM-метки и мусорные слова
            namePart = namePart.replace(/дата\s*рожд[а-яА-Я]*/ig, '');
            namePart = namePart.replace(/data\s*rozhd[a-zA-Z]*/ig, '');
            namePart = namePart.replace(/\bд\.?р\.?\b/ig, '');
            namePart = namePart.replace(/\bd\.?r\.?\b/ig, '');
            namePart = namePart.replace(/(?:^|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])(?:билет|пассажир|итого|сумма|заявка|бронь|турист|тур|пакс)(?=$|\s|[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\'])/ig, ' ');
            
            // ПРОВЕРКА НА СТРАННЫЕ ДАННЫЕ (непонятные цифры)
            // Исключаем слово "Гость N", которое генерируется самим приложением
            let checkName = namePart.replace(/гость\s*\d+/ig, '');
            const hasStrayNumbers = /\d/.test(checkName);

            // Очищаем имя от лишних символов (оставляем только буквы трех языков, дефисы и апострофы)
            namePart = namePart.replace(/[^a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\s\-\']/g, ' ').trim();
            namePart = namePart.replace(/^-+|-+$|^\'+|\'+$/g, '').trim();
            namePart = namePart.replace(/\s+/g, ' ');
            namePart = sanitizeProfanity(namePart);

            const wordsCount = namePart.split(' ').length;
            const hasDateOrAge = dobIso || tAge !== undefined || tYear !== undefined || parsedCategory;
            const isSuspicious = !hasDateOrAge && wordsCount < 2;

            if (namePart.length >= 2 && !hasStrayNumbers && (!isSuspicious || isForced)) {
                // Делаем первые буквы заглавными
                namePart = namePart.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');

                const guessed = guessGender(namePart);
                const touristObj = {
                    id: createId(),
                    fullName: namePart,
                    dob: dobIso,
                    gender: guessed,
                    genderManuallySet: false,
                    disability: 'none'
                };
                if (tAge !== undefined) touristObj.age = tAge;
                if (tYear !== undefined) touristObj.year = tYear;
                
                // Если категория определена из текста
                if (parsedCategory) {
                    touristObj.category = parsedCategory;
                    touristObj.categoryManuallySet = true;
                } else if (!dobIso && tAge === undefined && tYear === undefined) {
                    // Дефолтная категория, если нет дат
                    touristObj.category = 'ADL';
                    touristObj.categoryManuallySet = false;
                }
                
                // Проверка на дубликат (полное совпадение имени и даты/возраста)
                const isCleanState = Object.values(quickCounts).every(v => v === 0);
                const isDuplicate = tourists.some(t => 
                    t.fullName.toLowerCase() === touristObj.fullName.toLowerCase() && 
                    t.dob === touristObj.dob && 
                    t.age === touristObj.age && 
                    t.year === touristObj.year
                );

                if (!isDuplicate) {
                    tourists.push(touristObj);
                } else {
                    unrecognizedLines.push(originalLine + " (Дубликат)");
                }
            } else {
                unrecognizedLines.push(originalLine);
            }
        });
        
        // Удаляем пустую строку по умолчанию
        if (tourists.length > 1 && tourists[0].fullName === '' && tourists[0].dob === '') {
            tourists.shift();
        }

        render();
        
        if (unrecognizedLines.length > 0) {
            bulkText.value = unrecognizedLines.join('\n');
            if (!isForced) {
                window.showToast(`Часть строк подозрительна (нет дат или одно слово). Если всё верно, нажмите еще раз.`, 'fa-triangle-exclamation', 'bg-amber-500');
            } else {
                window.showToast(`Часть гостей не распознана (${unrecognizedLines.length} строк)`, 'fa-triangle-exclamation', 'bg-amber-500');
                lastAttemptedText = '';
            }
        } else {
            bulkText.value = '';
            lastAttemptedText = '';
        }
    });

    function createId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    window.clearAllTourists = function() {
        if (confirm('Вы уверены, что хотите удалить всех гостей и начать заново?')) {
            tourists = [];
            
            // Сбрасываем дату визита на сегодня
            const today = new Date();
            const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            if (visitDateInput) visitDateInput.value = todayStr;
            
            render();
        }
    };

    function addTourist() {
        tourists.push({
            id: createId(),
            fullName: '',
            dob: '',
            gender: 'male',
            genderManuallySet: false,
            disability: 'none'
        });
        render();
    }

    function removeTourist(id, btnElement) {
        if (btnElement) {
            const row = btnElement.closest('.tourist-row');
            if (row) {
                row.classList.remove('animate-row-in');
                row.classList.add('animate-row-out');
                setTimeout(() => {
                    tourists = tourists.filter(t => t.id !== id);
                    render();
                }, 250);
                return;
            }
        }
        tourists = tourists.filter(t => t.id !== id);
        render();
    }

    function updateTourist(id, field, value) {
        const tourist = tourists.find(t => t.id === id);
        if (tourist) {
            if (field === 'fullName') value = sanitizeProfanity(value);
            tourist[field] = value;
            if (field === 'fullName') {
                if (!tourist.genderManuallySet) {
                    tourist.gender = guessGender(value);
                }
                delete tourist.category;
                delete tourist.categoryManuallySet;
            }
            if (field === 'gender') {
                tourist.genderManuallySet = true;
            }
            if (field === 'dob') {
                delete tourist.age;
                delete tourist.year;
                delete tourist.category;
                delete tourist.categoryManuallySet;
            }
            render();
        }
    }
    function updateTouristDobDirect(id, value) {
        const tourist = tourists.find(t => t.id === id);
        if (!tourist) return;
        
        value = value.trim();
        if (!value) {
            tourist.dob = '';
            delete tourist.age;
            delete tourist.year;
            delete tourist.category;
            delete tourist.categoryManuallySet;
            render();
            return;
        }
        
        // 1. Проверяем, полная ли это дата (например, 15.06.1990)
        const dobRegex = /\b(0?[1-9]|[12]\d|3[01])([\.\-\/\s])(0?[1-9]|1[0-2])\2(\d{4}|\d{2})\b/;
        const match = value.match(dobRegex);
        if (match) {
            const parts = match[0].split(/[\.\-\/\s]+/);
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) {
                const yInt = parseInt(year);
                year = (yInt > 50 ? 1900 + yInt : 2000 + yInt).toString();
            }
            tourist.dob = `${year}-${month}-${day}`;
            delete tourist.age;
            delete tourist.year;
            delete tourist.category;
            delete tourist.categoryManuallySet;
            render();
            return;
        }
        
        // 2. Проверяем, только ли это год (например, 4 цифры типа 2018)
        const yearRegex = /\b(19\d{2}|20[0-2]\d)\b/;
        const yearMatch = value.match(yearRegex);
        if (yearMatch) {
            tourist.year = parseInt(yearMatch[1], 10);
            tourist.dob = '';
            delete tourist.age;
            delete tourist.category;
            delete tourist.categoryManuallySet;
            render();
            return;
        }
        
        // 3. Проверяем, только ли это возраст (например, 1 или 2 цифры типа 35)
        const ageRegex = /\b(\d{1,2})\b/;
        const ageMatch = value.match(ageRegex);
        if (ageMatch) {
            tourist.age = parseInt(ageMatch[1], 10);
            tourist.dob = '';
            delete tourist.year;
            delete tourist.category;
            delete tourist.categoryManuallySet;
            render();
            return;
        }
        
        // Если не распознали, записываем как dob
        tourist.dob = value;
        delete tourist.age;
        delete tourist.year;
        delete tourist.category;
        delete tourist.categoryManuallySet;
        render();
    }
    function updateTouristCategory(id, value) {
        const tourist = tourists.find(t => t.id === id);
        if (tourist) {
            tourist.category = value;
            tourist.categoryManuallySet = true;
            if (value !== 'INV') {
                tourist.disability = 'none';
            } else if (tourist.disability === 'none' || !tourist.disability) {
                const visitDate = visitDateInput ? visitDateInput.value : '';
                const age = tourist.age !== undefined ? tourist.age : calculateAge(tourist.dob, visitDate);
                if (age !== null && age >= 4 && age <= 11) {
                    tourist.disability = '3';
                } else {
                    tourist.disability = '1';
                }
            }
            render();
        }
    }

    function guessGender(name) {
        if (!name) return 'male';
        const cleanName = name.trim().toLowerCase();
        const words = cleanName.split(/\s+/);
        
        for (let word of words) {
            // 1. Женские окончания (казахские отчества и фамилии)
            if (word.endsWith('қызы') || word.endsWith('kyzy') || word.endsWith('qyzy')) return 'female';
            // 2. Мужские окончания (казахские отчества)
            if (word.endsWith('ұлы') || word.endsWith('uly') || word.endsWith('улы')) return 'male';
            
            // 3. Русские отчества
            if (word.endsWith('овна') || word.endsWith('евна') || word.endsWith('ична')) return 'female';
            if (word.endsWith('ович') || word.endsWith('евич') || word.endsWith('ич')) return 'male';
            if (word.endsWith('ovna') || word.endsWith('evna') || word.endsWith('ichna')) return 'female';
            if (word.endsWith('ovich') || word.endsWith('evich') || word.endsWith('ich')) return 'male';
            
            // 4. Русские/казахские фамилии на ova/eva/ina/aya/ова/ева/ина/ая
            if (word.endsWith('ова') || word.endsWith('ева') || word.endsWith('ина') || word.endsWith('ая')) return 'female';
            if (word.endsWith('ova') || word.endsWith('eva') || word.endsWith('ina') || word.endsWith('aya')) return 'female';
            
            // 5. Окончания казахских женских имен (нұр/нур/nur, гүл/гул/gul, ым/ім/ym/im)
            if (word.endsWith('нұр') || word.endsWith('нур') || word.endsWith('nur')) return 'female';
            if (word.endsWith('гүл') || word.endsWith('гул') || word.endsWith('gul')) return 'female';
            if (word.endsWith('ным') || word.endsWith('лым') || word.endsWith('рым') || word.endsWith('ным')) return 'female';
            
            // Известные женские имена без четких окончаний
            if (word.endsWith('айым') || word.endsWith('ару') || word.endsWith('аружан') || word.endsWith('улжан') || 
                word.endsWith('ұлжан') || word.endsWith('асем') || word.endsWith('әсем') || word.endsWith('асель') || 
                word.endsWith('әсел') || word.endsWith('айгерім') || word.endsWith('айгерим') || word.endsWith('арайлым')) {
                return 'female';
            }
            
            // 6. Окончания мужских имен/фамилий на ов/ев/ин/ий
            if (word.endsWith('ов') || word.endsWith('ев') || word.endsWith('ин') || word.endsWith('ий')) return 'male';
            if (word.endsWith('ov') || word.endsWith('ev') || word.endsWith('in') || word.endsWith('iy') || word.endsWith('y')) {
                // Если это Seidaly - это фамилия, может быть и мужской и женской. Но по дефолту оставим male.
            }
        }
        
        // Вторая итерация по отдельным словам для поиска женских окончаний на -а / -я в именах
        for (let word of words) {
            if (word.length > 2 && (word.endsWith('а') || word.endsWith('я') || word.endsWith('a') || word.endsWith('ya'))) {
                // Исключаем мужские имена/отчества
                if (!word.endsWith('овича') && !word.endsWith('евича') && !word.endsWith('ича') && 
                    !word.endsWith('илья') && !word.endsWith('никита') && !word.endsWith('данила') && !word.endsWith('баха')) {
                    return 'female';
                }
            }
        }
        
        return 'male';
    }

    function getRetirementAge(gender, visitDateStr) {
        if (gender === 'female') {
            if (!visitDateStr) return 61;
            const visitYear = new Date(visitDateStr).getFullYear();
            if (visitYear <= 2027) return 61;
            if (visitYear === 2028) return 61.5;
            if (visitYear === 2029) return 62;
            if (visitYear === 2030) return 62.5;
            return 63;
        }
        return 63; // Men
    }

    function calculateAge(dobStr, visitDateStr) {
        if (!dobStr || !visitDateStr) return null;
        const dob = new Date(dobStr);
        const visit = new Date(visitDateStr);
        let age = visit.getFullYear() - dob.getFullYear();
        
        if (visit.getMonth() < dob.getMonth() || (visit.getMonth() === dob.getMonth() && visit.getDate() < dob.getDate())) {
            age--;
        }
        
        return age;
    }

    function getPassengerCategory(age, gender, visitDateStr) {
        if (age === null) return '-';
        const retirementAge = getRetirementAge(gender, visitDateStr);
        if (age >= retirementAge) return 'SNR';
        if (age >= 12) return 'ADL';
        if (age >= 4) return 'CHLD';
        return 'INF';
    }

    function getBasePrice(visitDateStr, clientType, tariffType, passengerCategory, age = null) {
        if (!visitDateStr || passengerCategory === '-') return 0;
        
        const visitDate = new Date(visitDateStr);
        const md = String(visitDate.getMonth() + 1).padStart(2, '0') + '-' + String(visitDate.getDate()).padStart(2, '0');
        
        const periods = CONFIG.tariffs[tariffType] || [];
        let activePeriod = null;
        for (let p of periods) {
            if (md >= p.start && md <= p.end) {
                activePeriod = p;
                break;
            }
        }
        
        if (!activePeriod) return -1; // -1 означает что нет тарифа
        
        if (passengerCategory === 'INF') return 0; // Младенцы всегда бесплатно по базе
        
        let priceCategory = passengerCategory;
        if (passengerCategory === 'SNR') {
            priceCategory = 'ADL';
        } else if (passengerCategory === 'INV') {
            priceCategory = (age !== null && age >= 4 && age < 12) ? 'CHLD' : 'ADL';
        }
        if (!activePeriod[clientType]) return 0;
        return activePeriod[clientType][priceCategory] || 0;
    }

    function calculateDiscount(dobStr, visitDateStr, disability, age, gender, category) {
        if (!visitDateStr) return { percent: 0, isBirthday: false, isPensioner: false, isInfant: false };
        
        let maxDiscount = 0;
        
        if (age !== null && age <= 3) maxDiscount = Math.max(maxDiscount, 100);
        if (disability === '1') maxDiscount = Math.max(maxDiscount, 100);
        
        let isBirthday = false;
        if (dobStr) {
            const dob = new Date(dobStr);
            const visit = new Date(visitDateStr);
            isBirthday = dob.getDate() === visit.getDate() && dob.getMonth() === visit.getMonth();
        }
        if (isBirthday) maxDiscount = Math.max(maxDiscount, 50);
        
        const retirementAge = getRetirementAge(gender, visitDateStr);
        const isPensioner = (age !== null && age >= retirementAge) || category === 'SNR';
        if (isPensioner) maxDiscount = Math.max(maxDiscount, 50);
        
        if (disability === '2') maxDiscount = Math.max(maxDiscount, 15);
        if (disability === '3') maxDiscount = Math.max(maxDiscount, 10);
        
        return { percent: maxDiscount, isBirthday: isBirthday, isPensioner: isPensioner, isInfant: age !== null && age <= 3 };
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return dateStr;
    }

    function render() {
        const visitDate = visitDateInput ? visitDateInput.value : '';
        const clientType = clientTypeInput ? clientTypeInput.value : 'tourist';
        const tariffType = tariffTypeInput ? tariffTypeInput.value : 'day';

        // Управление видимостью кнопки Раннего Бронирования
        if (visitDate && earlyBookingContainer) {
            const vDate = new Date(visitDate);
            const today = new Date();
            // Акция действует СТРОГО 28, 29, 30 июня
            const isPromoDays = today.getMonth() === 5 && (today.getDate() >= 28 && today.getDate() <= 30);
            
            // Месяц июль (0-индексация, значит 6)
            if (vDate.getMonth() === 6 && isPromoDays) {
                earlyBookingContainer.classList.remove('hidden');
            } else {
                earlyBookingContainer.classList.add('hidden');
                if (earlyBookingToggle) earlyBookingToggle.checked = false;
            }
        }

        // Управление бейджом "Раннее бронирование" в итоге
        if (earlyBookingBadge && earlyBookingToggle) {
            if (earlyBookingToggle.checked) {
                earlyBookingBadge.classList.remove('hidden');
            } else {
                earlyBookingBadge.classList.add('hidden');
            }
        }

        if (touristListEl) touristListEl.innerHTML = '';
        
        if (emptyState) {
            if (tourists.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        }

        let totalSum = 0;
        let isTariffFound = true;

        // Для статистики
        let counts = { adl: 0, chld: 0, inf: 0, pens: 0, bday: 0 };
        let exportDataList = [];

        tourists.forEach((t, index) => {
            if (!t.gender) t.gender = 'male';
            if (t.genderManuallySet === undefined) t.genderManuallySet = false;

            let age = null;
            let displayDob = '';
            if (t.age !== undefined) {
                age = t.age;
                const visitYear = visitDate ? new Date(visitDate).getFullYear() : new Date().getFullYear();
                displayDob = (visitYear - t.age).toString();
            } else if (t.year !== undefined) {
                age = (visitDate ? new Date(visitDate).getFullYear() : new Date().getFullYear()) - t.year;
                displayDob = t.year.toString();
            } else {
                age = calculateAge(t.dob, visitDate);
                if (t.dob) {
                    displayDob = formatDate(t.dob);
                }
            }

            let category = getPassengerCategory(age, t.gender, visitDate);
            if (t.categoryManuallySet && t.category) {
                category = t.category;
            } else if (age === null && t.category) {
                category = t.category;
            }
            t.category = category;
            
            const basePrice = getBasePrice(visitDate, clientType, tariffType, category, age);
            
            if (basePrice === -1) isTariffFound = false;

            const today = new Date();
            const vDate = visitDate ? new Date(visitDate) : null;
            // Акция применяется, если галочка включена (а галочка доступна только для июля)
            const earlyBookingEnabled = earlyBookingToggle ? earlyBookingToggle.checked : false;
            const discountInfo = calculateDiscount(t.dob, visitDate, category === 'INV' ? t.disability : 'none', age, t.gender, category);
            let discountPercent = discountInfo.percent || 0;
            
            if (category === 'INV' && t.disability !== '2' && t.disability !== '3') {
                discountPercent = 100;
            }
            
            // Акция Раннего Бронирования (15%) не действует на инвалидов, именинников и пенсионеров
            const hasOtherDiscounts = discountInfo.isBirthday || discountInfo.isPensioner || (t.disability && t.disability !== '0' && t.disability !== 'none');
            if (earlyBookingEnabled && !hasOtherDiscounts && discountPercent < 100 && age >= 4) {
                discountPercent = Math.max(discountPercent, CONFIG.discounts.earlyBooking);
            }
            
            let finalPrice = 0;
            if (basePrice > 0) {
                finalPrice = basePrice * (1 - discountPercent / 100);
            }

            // Накопление статистики
            if (category === 'ADL') counts.adl++;
            if (category === 'CHLD') counts.chld++;
            if (category === 'INF') counts.inf++;
            if (category === 'SNR') counts.pens++;
            if (category === 'INV' || t.disability === '1' || t.disability === '2' || t.disability === '3') counts.inv = (counts.inv || 0) + 1;
            if (discountInfo.isBirthday) counts.bday++;

            totalSum += finalPrice;

            // Строка для экспорта (подготовка данных)
            if (t.fullName && (t.dob || t.age !== undefined || t.year !== undefined)) {
                let tags = [];
                if (discountInfo.isBirthday) tags.push("ДР");
                if (t.disability === '1') tags.push("Инв 100%");
                if (t.disability === '2') tags.push("Инв 15%");
                if (t.disability === '3') tags.push("Инв 10%");

                let formattedDob = '';
                if (t.dob) {
                    formattedDob = formatDate(t.dob);
                } else if (t.year !== undefined) {
                    formattedDob = `${t.year} г.`;
                } else if (t.age !== undefined) {
                    formattedDob = `${t.age} лет`;
                }

                exportDataList.push({
                    translitName: transliterate(t.fullName),
                    category: category,
                    formattedDob: formattedDob,
                    tags: tags,
                    gender: t.gender === 'female' ? 'F' : 'M',
                    isBirthday: discountInfo.isBirthday
                });
            }

            // Динамический бейдж с микро-анимацией (свечение)
            // Динамический стиль для выпадающего списка типа (бейдж)
            let catSelectClass = 'border-slate-200 text-slate-700 bg-white';
            if (category === 'ADL') catSelectClass = 'bg-blue-50 text-blue-600 border-blue-200';
            if (category === 'SNR') catSelectClass = 'bg-purple-50 text-purple-600 border-purple-200';
            if (category === 'CHLD') catSelectClass = 'bg-teal-50 text-teal-600 border-teal-200';
            if (category === 'INF') catSelectClass = 'bg-green-50 text-green-600 border-green-200';
            if (category === 'INV') catSelectClass = 'bg-rose-50 text-rose-600 border-rose-200';

            // Создание DOM элемента строки
            const row = document.createElement('div');
            row.className = 'tourist-row p-1.5 md:p-1 flex flex-col md:grid md:grid-cols-12 gap-1.5 md:gap-1 items-start md:items-center transition-all relative hover:bg-slate-50 animate-row-in';
            row.innerHTML = `
                <!-- Mobile Label: Delete Button -->
                <div class="absolute top-1.5 right-1.5 md:static md:col-span-1 md:w-full flex justify-end md:order-last">
                    <button onclick="removeTourist('${t.id}', this)" class="btn-danger p-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Удалить">
                        <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
                    </button>
                </div>
                
                <div class="w-full flex gap-2 pr-6 md:pr-0 md:contents">
                    <!-- Full Name -->
                    <div class="flex-1 md:col-span-3 w-full relative">
                        <label class="md:hidden text-[8px] text-slate-400 uppercase font-semibold mb-0.5 block">ФИО (Рус/Каз)</label>
                        <input type="text" placeholder="ФИО туриста" value="${t.fullName}" 
                            onblur="updateTourist('${t.id}', 'fullName', this.value)"
                            class="w-full text-left bg-transparent text-slate-800 border ${!t.fullName ? 'border-red-300 bg-red-50/40' : 'border-transparent'} hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none rounded-lg px-2 py-1 text-xs font-medium transition-colors ${discountInfo.isBirthday ? 'pr-7' : ''}">
                        ${discountInfo.isBirthday ? '<div class="absolute right-2 top-[calc(50%+4px)] md:top-1/2 -translate-y-1/2 text-amber-500 text-[10px]" title="Именинник"><i class="fa-solid fa-cake-candles"></i></div>' : ''}
                    </div>
                    
                    <!-- DOB -->
                    <div class="w-[100px] shrink-0 md:w-full md:col-span-2">
                        <label class="md:hidden text-[8px] text-slate-400 uppercase font-semibold mb-0.5 block">Дата рожд.</label>
                        <input type="text" value="${displayDob}" 
                            placeholder="дд.мм.гггг или гггг"
                            onblur="updateTouristDobDirect('${t.id}', this.value)"
                            class="w-full text-left bg-transparent text-slate-800 border ${(!t.dob && t.age === undefined && t.year === undefined) ? 'border-red-300 bg-red-50/40' : 'border-transparent'} hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none rounded-lg px-0.5 py-1 text-xs font-medium transition-colors">
                    </div>
                </div>
                
                <!-- Stats Row (Age, Category, Price) -->
                <div class="col-span-12 w-full flex flex-wrap justify-between items-center mt-1 md:mt-0 md:contents border-t border-slate-100 md:border-0 pt-1.5 md:pt-0">
                    <div class="flex space-x-2 sm:space-x-4 md:space-x-6 md:contents">
                        <!-- Age -->
                        <div class="md:col-span-1 text-left md:text-center flex flex-col items-start md:items-center">
                            <label class="md:hidden text-[8px] text-slate-400 uppercase font-semibold mb-0.5">Возраст</label>
                            <span class="text-xs font-bold ${age === null ? 'text-slate-400' : 'text-[#0076ba]'}">
                                ${age !== null ? age : '-'}
                            </span>
                        </div>
                        
                        <!-- Category -->
                        <div class="md:col-span-1 text-left md:text-center flex flex-col items-start md:items-center w-full md:w-auto">
                            <label class="md:hidden text-[8px] text-slate-400 uppercase font-semibold mb-0.5">Тип</label>
                            <select onchange="updateTouristCategory('${t.id}', this.value)"
                                class="text-[9px] font-bold px-1.5 py-0.5 rounded border ${catSelectClass} focus:outline-none transition-all duration-300 cursor-pointer text-center w-full md:w-auto">
                                <option value="ADL" ${category === 'ADL' ? 'selected' : ''}>ADL</option>
                                <option value="CHLD" ${category === 'CHLD' ? 'selected' : ''}>CHLD</option>
                                <option value="INF" ${category === 'INF' ? 'selected' : ''}>INF</option>
                                <option value="SNR" ${category === 'SNR' ? 'selected' : ''}>SNR</option>
                                <option value="INV" ${category === 'INV' ? 'selected' : ''}>INV</option>
                            </select>
                        </div>

                        <!-- Disability -->
                        <div class="md:col-span-2 text-left md:text-center flex flex-col items-start md:items-center w-full md:w-auto">
                            ${category === 'INV' ? `
                            <label class="md:hidden text-[8px] text-slate-400 uppercase font-semibold mb-0.5">Льгота</label>
                            <select onchange="updateTourist('${t.id}', 'disability', this.value)"
                                class="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 bg-white focus:outline-none transition-all duration-300 cursor-pointer text-center w-full md:w-auto">
                                <option value="1" ${t.disability === '1' || t.disability === 'none' ? 'selected' : ''}>Инв 1 кат. (100%)</option>
                                <option value="2" ${t.disability === '2' ? 'selected' : ''}>Инв 2 кат. (15%)</option>
                                <option value="3" ${t.disability === '3' ? 'selected' : ''}>Инв 3 кат. (10%)</option>
                            </select>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Price -->
                    <div class="md:col-span-2 text-right flex flex-col items-end justify-center pr-2">
                        ${discountPercent > 0 ? `<span class="badge-discount text-[8px] px-1.5 py-0.5 rounded-full mb-0.5 leading-none font-bold">-${discountPercent}%</span>` : ''}
                        <span class="text-xs font-bold ${finalPrice > 0 ? 'text-slate-900' : 'text-slate-400'}">
                            ${basePrice === -1 ? 'Нет тарифа' : Math.round(finalPrice).toLocaleString('ru-RU')} ₸
                        </span>
                    </div>
                </div>
            `;
            
            touristListEl.appendChild(row);
        });

        // Обновление итогов с учетом промокода
        let finalTotalSum = totalSum;
        let appliedPromo = null;
        
        if (promoInput && promoInput.value.trim().toUpperCase() in CONFIG.promocodes) {
            appliedPromo = CONFIG.promocodes[promoInput.value.trim().toUpperCase()];
            if (appliedPromo.type === 'percent') {
                finalTotalSum = totalSum * (1 - appliedPromo.value / 100);
            } else if (appliedPromo.type === 'fixed') {
                finalTotalSum = Math.max(0, totalSum - appliedPromo.value);
            }
        }
        
        totalPriceEl.textContent = Math.round(finalTotalSum).toLocaleString('ru-RU');
        
        if (!isTariffFound) {
            dateWarning.classList.remove('hidden');
        } else {
            dateWarning.classList.add('hidden');
        }

        // Обновление статистики
        stats.adl.textContent = counts.adl;
        stats.chld.textContent = counts.chld;
        stats.inf.textContent = counts.inf;
        stats.pens.textContent = counts.pens;
        if (stats.inv) stats.inv.textContent = counts.inv || 0;
        stats.bday.textContent = counts.bday;

        let exportText = `${visitDate ? formatDate(visitDate) : 'Не указана'}\n`;
        exportText += `Тариф: ${tariffType === 'evening' ? 'Вечерний' : 'Дневной'}\n\n`;

        if (currentCalcMode === 'quick') {
            exportText += `Состав гостей:\n`;
            let hasQuickGuests = false;
            if (quickCounts.adl > 0) { exportText += `Взрослые ADL: ${quickCounts.adl}\n`; hasQuickGuests = true; }
            if (quickCounts.chld > 0) { exportText += `Дети CHLD: ${quickCounts.chld}\n`; hasQuickGuests = true; }
            if (quickCounts.pens > 0) { exportText += `Пенсионеры SNR: ${quickCounts.pens}\n`; hasQuickGuests = true; }
            if (quickCounts.inf > 0) { exportText += `Младенцы INF: ${quickCounts.inf}\n`; hasQuickGuests = true; }
            if (quickCounts.inv > 0) { exportText += `Инвалиды 1 кат. INV: ${quickCounts.inv}\n`; hasQuickGuests = true; }
            if (quickCounts.inv2 > 0) { exportText += `Инвалиды 2 кат. INV2: ${quickCounts.inv2}\n`; hasQuickGuests = true; }
            if (quickCounts.inv3 > 0) { exportText += `Инвалиды 3 кат. INV3: ${quickCounts.inv3}\n`; hasQuickGuests = true; }
            if (!hasQuickGuests) {
                exportText += 'Пусто\n';
            }
        } else {
            // Сортируем: у кого ДР - в самый конец списка
            exportDataList.sort((a, b) => {
                if (a.isBirthday && !b.isBirthday) return 1;
                if (!a.isBirthday && b.isBirthday) return -1;
                return 0;
            });

            // Формируем финальные строки
            let exportLines = exportDataList.map((item) => {
                const tagsStr = item.tags.length > 0 ? ` (${item.tags.join(', ')})` : '';
                return `${item.translitName.toUpperCase()} ${item.formattedDob}${tagsStr} ${item.category}`;
            });

            exportText += `Список гостей:\n`;
            exportText += exportLines.length > 0 ? exportLines.join('\n') : 'Пусто';
        }

        if (appliedPromo) {
            exportText += `\nПромокод: ${promoInput.value.trim().toUpperCase()} (-${appliedPromo.value}${appliedPromo.type === 'percent' ? '%' : ' ₸'})`;
        }
        if (commentInput && commentInput.value.trim()) {
            exportText += `\nКомментарий: ${commentInput.value.trim()}`;
        }
        exportText += `\n\nИТОГО: ${Math.round(finalTotalSum).toLocaleString('ru-RU')} тенге`;

        // Экспорт данных
        exportDataEl.value = exportText;
        exportDataEl.style.height = 'auto';
        exportDataEl.style.height = exportDataEl.scrollHeight + 'px';

        // Применяем поиск, если он активен
        const searchInput = document.getElementById('guestSearchInput');
        if (searchInput && searchInput.value) {
            if (window.filterGuests) {
                window.filterGuests(searchInput.value);
            }
        }

        // Авто-сохранение
        saveDraft();

        // Для доступа из HTML
        window.updateTourist = updateTourist;
        window.removeTourist = removeTourist;
        window.updateTouristDobDirect = updateTouristDobDirect;
        window.updateTouristCategory = updateTouristCategory;
    }

    function saveDraft() {
        const data = {
            visitDate: visitDateInput ? visitDateInput.value : '',
            clientType: clientTypeInput ? clientTypeInput.value : 'tourist',
            tariffType: tariffTypeInput ? tariffTypeInput.value : 'day',
            tourists: tourists,
            currentCalcMode: currentCalcMode,
            quickCounts: quickCounts,
            promo: promoInput ? promoInput.value : '',
            comment: commentInput ? commentInput.value : ''
        };
        localStorage.setItem('tetisBluDraft', JSON.stringify(data));
    }

    function syncDetailedToQuick() {
        let counts = { adl: 0, chld: 0, pens: 0, inf: 0, inv: 0, inv2: 0, inv3: 0 };
        const visitDate = visitDateInput ? visitDateInput.value : '';
        tourists.forEach(t => {
            let age = null;
            if (t.age !== undefined) {
                age = t.age;
            } else if (t.year !== undefined) {
                const visitYear = visitDate ? new Date(visitDate).getFullYear() : new Date().getFullYear();
                age = visitYear - t.year;
            } else {
                age = calculateAge(t.dob, visitDate);
            }
            let category = getPassengerCategory(age, t.gender, visitDate);
            if (t.categoryManuallySet && t.category) {
                category = t.category;
            } else if (age === null && t.category) {
                category = t.category;
            }

            if (t.disability === '1' || category === 'INV') {
                counts.inv++;
            } else if (t.disability === '2') {
                counts.inv2++;
            } else if (t.disability === '3') {
                counts.inv3++;
            } else if (category === 'ADL') counts.adl++;
            else if (category === 'CHLD') counts.chld++;
            else if (category === 'SNR') counts.pens++;
            else if (category === 'INF') counts.inf++;
        });
        quickCounts = counts;
        updateQuickInputsDOM();
    }

    function syncQuickToDetailed() {
        tourists = [];
        const today = new Date();
        const visitDateStr = visitDateInput ? visitDateInput.value : '';
        const visitYear = visitDateStr ? new Date(visitDateStr).getFullYear() : today.getFullYear();
        
        // Add Adults (age 25)
        for (let i = 0; i < quickCounts.adl; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 25}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: 'none'
            });
        }
        // Add Children (age 8)
        for (let i = 0; i < quickCounts.chld; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 8}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: 'none'
            });
        }
        // Add Pensioners (age 65)
        for (let i = 0; i < quickCounts.pens; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 65}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: 'none'
            });
        }
        // Add Infants (age 1)
        for (let i = 0; i < quickCounts.inf; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 1}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: 'none'
            });
        }
        // Add Disabled (INV)
        for (let i = 0; i < quickCounts.inv; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 30}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: '1',
                category: 'INV',
                categoryManuallySet: true
            });
        }
        // Add Disabled 2nd Category (INV2)
        for (let i = 0; i < quickCounts.inv2; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 30}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: '2',
                category: 'INV',
                categoryManuallySet: true
            });
        }
        // Add Disabled 3rd Category (INV3) - Adults
        for (let i = 0; i < quickCounts.inv3; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 30}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: '3',
                category: 'INV',
                categoryManuallySet: true
            });
        }
        // Add Disabled Children (CHLD_INV)
        for (let i = 0; i < quickCounts.chld_inv; i++) {
            tourists.push({
                id: createId(),
                fullName: `Гость ${tourists.length + 1}`,
                dob: `${visitYear - 8}-06-15`,
                gender: 'male',
                genderManuallySet: false,
                disability: '3',
                category: 'INV',
                categoryManuallySet: true
            });
        }
    }

    function updateQuickInputsDOM() {
        const adlEl = document.getElementById('quick_adl');
        const chldEl = document.getElementById('quick_chld');
        const pensEl = document.getElementById('quick_pens');
        const infEl = document.getElementById('quick_inf');
        const invEl = document.getElementById('quick_inv');
        const inv2El = document.getElementById('quick_inv2');
        const inv3El = document.getElementById('quick_inv3');
        const chldInvEl = document.getElementById('quick_chld_inv');
        if (adlEl) adlEl.value = quickCounts.adl;
        if (chldEl) chldEl.value = quickCounts.chld;
        if (pensEl) pensEl.value = quickCounts.pens;
        if (infEl) infEl.value = quickCounts.inf;
        if (invEl) invEl.value = quickCounts.inv;
        if (inv2El) inv2El.value = quickCounts.inv2;
        if (inv3El) inv3El.value = quickCounts.inv3;
        if (chldInvEl) chldInvEl.value = quickCounts.chld_inv;
    }

    function switchCalcMode(mode) {
        currentCalcMode = mode;
        const tabDetailed = document.getElementById('tabDetailed');
        const tabQuick = document.getElementById('tabQuick');
        const detailedModeContainer = document.getElementById('detailedModeContainer');
        const quickModeContainer = document.getElementById('quickModeContainer');
        const detailedActionButtons = document.getElementById('detailedActionButtons');
        const resetQuickBtn = document.getElementById('resetQuickBtn');
        const emptyState = document.getElementById('emptyState');
        
        if (!tabDetailed || !tabQuick) return;

        if (mode === 'detailed') {
            tabDetailed.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
            tabDetailed.classList.remove('text-slate-500');
            tabQuick.classList.add('text-slate-500');
            tabQuick.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
            
            detailedModeContainer.classList.remove('hidden');
            quickModeContainer.classList.add('hidden');
            detailedActionButtons.classList.remove('hidden');
            resetQuickBtn.classList.add('hidden');
            
            if (tourists.length === 0 && (quickCounts.adl > 0 || quickCounts.chld > 0 || quickCounts.pens > 0 || quickCounts.inf > 0 || quickCounts.inv > 0)) {
                syncQuickToDetailed();
            }
        } else {
            tabQuick.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
            tabQuick.classList.remove('text-slate-500');
            tabDetailed.classList.add('text-slate-500');
            tabDetailed.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
            
            detailedModeContainer.classList.add('hidden');
            quickModeContainer.classList.remove('hidden');
            detailedActionButtons.classList.add('hidden');
            resetQuickBtn.classList.remove('hidden');
            emptyState.classList.add('hidden');
            
            if (quickCounts.adl === 0 && quickCounts.chld === 0 && quickCounts.pens === 0 && quickCounts.inf === 0 && quickCounts.inv === 0 && quickCounts.inv2 === 0 && quickCounts.inv3 === 0) {
                syncDetailedToQuick();
            }
        }
        
        render();
    }

    function changeQuickCount(category, delta) {
        // Валидация: Дети и малыши не могут быть без взрослых (adl) или пенсионеров (pens)
        if ((category === 'chld' || category === 'inf') && delta > 0 && quickCounts.adl === 0 && quickCounts.pens === 0) {
            if (window.showToast) {
                window.showToast('Дети могут посещать парк только в сопровождении взрослых', 'fa-triangle-exclamation', 'bg-amber-500');
            }
            return;
        }

        quickCounts[category] = Math.max(0, quickCounts[category] + delta);
        
        // Авто-сброс детей, если убрали взрослых
        if ((category === 'adl' || category === 'pens') && quickCounts.adl === 0 && quickCounts.pens === 0) {
            quickCounts.chld = 0;
            quickCounts.inf = 0;
        }

        updateQuickInputsDOM();
        syncQuickToDetailed();
        render();
    }

    function updateQuickCount(category, val) {
        const newVal = Math.max(0, parseInt(val) || 0);
        
        if ((category === 'chld' || category === 'inf') && newVal > quickCounts[category] && quickCounts.adl === 0 && quickCounts.pens === 0) {
            if (window.showToast) {
                window.showToast('Дети могут посещать парк только в сопровождении взрослых', 'fa-triangle-exclamation', 'bg-amber-500');
            }
            updateQuickInputsDOM(); // вернуть старое значение в инпут
            return;
        }

        quickCounts[category] = newVal;
        
        if ((category === 'adl' || category === 'pens') && quickCounts.adl === 0 && quickCounts.pens === 0) {
            quickCounts.chld = 0;
            quickCounts.inf = 0;
        }

        updateQuickInputsDOM();
        syncQuickToDetailed();
        render();
    }

    function resetQuickCounts() {
        quickCounts = { adl: 0, chld: 0, pens: 0, inf: 0, inv: 0, inv2: 0, inv3: 0 };
        updateQuickInputsDOM();
        syncQuickToDetailed();
        render();
    }

    window.switchCalcMode = switchCalcMode;
    window.changeQuickCount = changeQuickCount;
    window.updateQuickCount = updateQuickCount;
    window.resetQuickCounts = resetQuickCounts;

    function validateAccompaniment() {
        const adlStat = parseInt(document.getElementById('statAdl').textContent) || 0;
        const pensStat = parseInt(document.getElementById('statPens').textContent) || 0;
        const chldStat = parseInt(document.getElementById('statChld').textContent) || 0;
        const infStat = parseInt(document.getElementById('statInf').textContent) || 0;
        
        if ((chldStat > 0 || infStat > 0) && adlStat === 0 && pensStat === 0) {
            if (window.showToast) {
                window.showToast('Внимание! Дети не могут быть в чеке без взрослых.', 'fa-triangle-exclamation', 'bg-red-500');
            }
            return false;
        }
        return true;
    }

    function copyExportData() {
        if (!validateAccompaniment()) return;
        if (!exportDataEl.value) return;
        
        navigator.clipboard.writeText(exportDataEl.value).then(() => {
            const originalHTML = copyExportBtn.innerHTML;
            copyExportBtn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Скопировано';
            copyExportBtn.classList.add('bg-emerald-600', 'text-white');
            copyExportBtn.classList.remove('bg-blue-50', 'text-brand-blue');
            
            setTimeout(() => {
                copyExportBtn.innerHTML = originalHTML;
                copyExportBtn.classList.remove('bg-emerald-600', 'text-white');
                copyExportBtn.classList.add('bg-blue-50', 'text-brand-blue');
            }, 2000);
        });
    }

    if (copyExportBtn) {
        copyExportBtn.addEventListener('click', copyExportData);
    }

    // --- ЛОГИКА ДНЯ РОЖДЕНИЯ ---
    // --- ЛОГИКА ГЕНЕРАЦИИ ЧЕКА КАРТИНКОЙ ---
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', generateReceiptImage);
    }
    
    // --- ЛОГИКА ОТПРАВКИ (SHARE TEXT / IMAGE) ---
    const nativeShareBtn = document.getElementById('nativeShareBtn');

    function getShareText() {
        if (!validateAccompaniment()) return '';
        saveToHistory();
        const text = exportDataEl.value;
        return `*Официальный расчет Tetys Blu*\n\n${text}`;
    }

    // Общая функция для шаринга картинки чека
    async function shareReceiptImage(btn) {
        if (!validateAccompaniment()) return;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin sm:mr-1.5"></i> <span class="hidden sm:inline">Подождите...</span>';
        try {
            const { shareData, dataUrl } = await generateImageForShare();
            
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error('ShareNotSupported');
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Share Error:', e);
                // Из-за ограничений безопасности Safari (iOS) и некоторых Android, 
                // если генерация картинки заняла время, браузер блокирует окно "Поделиться".
                // В качестве запасного плана - просто скачиваем картинку!
                window.showToast('Браузер заблокировал окно. Чек автоматически скачан!', 'fa-download', 'bg-[#0076ba]');
                
                // Эмулируем нажатие "Скачать"
                const downloadBtn = document.getElementById('downloadReceiptBtn');
                if (downloadBtn) {
                    downloadBtn.click();
                }
            }
        } finally {
            btn.innerHTML = originalHtml;
        }
    }

    if (nativeShareBtn) {
        nativeShareBtn.addEventListener('click', function() {
            shareReceiptImage(this);
        });
    }

    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', async function() {
            if (!validateAccompaniment()) return;
            const originalHtml = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin sm:mr-1.5 text-white"></i> <span class="hidden sm:inline">Отправка...</span>';
            try {
                saveToHistory();
                const { shareData } = await generateImageForShare();
                const file = shareData.files[0];
                let copied = false;
                
                // Пробуем скопировать картинку в буфер
                if (navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [file.type]: file
                        })
                    ]);
                    copied = true;
                }
                
                // Открываем WhatsApp без приветственного текста
                window.open('https://wa.me/', '_blank');
                
                if (copied) {
                    window.showToast('Картинка скопирована! В WhatsApp нажмите "Вставить" (Paste)', 'fa-check', 'bg-green-600');
                }
            } catch (err) {
                console.error('Ошибка копирования:', err);
                // Если не удалось скопировать картинку (ограничения браузера), просто отправляем текстовую версию
                const text = getShareText();
                if (text) {
                    const encodedText = encodeURIComponent(text);
                    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                    window.showToast('Браузер запретил копировать картинку. Отправлен текстовый чек.', 'fa-info-circle', 'bg-amber-500');
                }
            } finally {
                this.innerHTML = originalHtml;
            }
        });
    }

    function sendToEmail() {
        if (!validateAccompaniment()) return;
        saveToHistory();
        const text = exportDataEl.value;
        if (!text) return;
        
        // Парсим текст для темы и тела
        const lines = text.split('\n');
        let dateStr = lines[0].trim(); // Первая строка теперь дата
        let tariffStr = '';
        let bodyText = '';
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('Тариф:')) {
                tariffStr = lines[i].trim();
            } else if (lines[i].startsWith('Список гостей:') || lines[i].startsWith('Состав гостей:')) {
                // Все оставшиеся строки — это тело
                bodyText = lines.slice(i).join('\n').trim();
                break;
            }
        }
        
        const subject = `${dateStr} | ${tariffStr}`;
        
        // Проверяем, мобильное ли это устройство
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // На смартфоне открываем нативное приложение почты (Mail, Gmail app и т.д.)
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        } else {
            // На ПК открываем Gmail в браузере в новой вкладке
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
            window.open(gmailUrl, '_blank');
        }
    }
    
    const emailExportBtn = document.getElementById('emailExportBtn');
    if (emailExportBtn) {
        emailExportBtn.addEventListener('click', sendToEmail);
    }

    async function generateImageForShare() {
        return new Promise((resolve, reject) => {
            const container = document.getElementById('receiptContainer');
            const content = document.getElementById('receiptContent');
            
            fillReceiptData();
            
            // Временно достаем блок для рендера
            content.classList.remove('opacity-0', 'pointer-events-none');
            document.body.appendChild(content); 
            content.style.position = 'fixed';
            content.style.top = '0';
            content.style.left = '0';
            content.style.zIndex = '-9999';
            
            html2canvas(content, { scale: 2, backgroundColor: '#ffffff', logging: false }).then(canvas => {
                // Возвращаем элемент на место
                content.style.position = '';
                content.style.top = '';
                content.style.left = '';
                content.style.zIndex = '';
                content.classList.add('opacity-0', 'pointer-events-none');
                container.appendChild(content);
                
                const dataUrl = canvas.toDataURL('image/png');
                
                canvas.toBlob(async (blob) => {
                    if (!blob) return reject(new Error('Не удалось создать blob'));
                    
                    const formattedDate = visitDateInput ? visitDateInput.value : 'date';
                    const file = new File([blob], `TetysBlu_Check_${formattedDate}.png`, { type: 'image/png' });
                    
                    // ВАЖНО: Для iOS Safari мы передаем ТОЛЬКО файл. 
                    const shareData = {
                        files: [file]
                    };
                    
                    resolve({ shareData, dataUrl });
                }, 'image/png');
            }).catch(err => {
                // Возврат элемента на место в случае ошибки
                content.style.position = '';
                content.style.top = '';
                content.style.left = '';
                content.classList.add('opacity-0', 'pointer-events-none');
                container.appendChild(content);
                reject(err);
            });
        });
    }

    function fillReceiptData() {
        const metaEl = document.getElementById('receiptMeta');
        const touristsEl = document.getElementById('receiptTourists');
        
        const dateParts = visitDateInput ? visitDateInput.value.split('-') : [];
        const visitDateStr = visitDateInput ? visitDateInput.value : '';
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : visitDateStr;
        const clientType = clientTypeInput ? clientTypeInput.value : 'tourist';
        const tariffType = tariffTypeInput ? tariffTypeInput.value : 'day';
        
        const clientText = clientType === 'agent' ? 'Турагент' : 'Турист';
        const tariffText = tariffTypeInput ? tariffTypeInput.options[tariffTypeInput.selectedIndex].text : 'Дневной тариф';
        
        metaEl.innerHTML = `
            <div class="flex justify-between items-center"><span class="text-[#0076ba]">Дата:</span> <span class="font-bold text-[#1e293b]">${formattedDate}</span></div>
            <div class="flex justify-between items-center"><span class="text-[#0076ba]">Клиент:</span> <span class="font-bold text-[#1e293b]">${clientText}</span></div>
            <div class="flex justify-between items-center"><span class="text-[#0076ba]">Тариф:</span> <span class="font-bold text-[#1e293b]">${tariffText}</span></div>
        `;
        
        touristsEl.innerHTML = '';
        if (currentCalcMode === 'quick') {
            let listHtml = '';
            if (quickCounts.adl > 0) {
                listHtml += `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-[#1e293b] text-[15px]">ВЗРОСЛЫЕ (ADL): ${quickCounts.adl}</div></div>`;
            }
            if (quickCounts.chld > 0) {
                listHtml += `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-[#1e293b] text-[15px]">ДЕТИ (CHLD): ${quickCounts.chld}</div></div>`;
            }
            if (quickCounts.pens > 0) {
                listHtml += `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-[#1e293b] text-[15px]">ПЕНСИОНЕРЫ (SNR): ${quickCounts.pens}</div></div>`;
            }
            if (quickCounts.inf > 0) {
                listHtml += `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-[#1e293b] text-[15px]">МЛАДЕНЦЫ (INF): ${quickCounts.inf}</div></div>`;
            }
            if (quickCounts.inv > 0) {
                listHtml += `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-[#1e293b] text-[15px]">ИНВАЛИДЫ (INV): ${quickCounts.inv}</div></div>`;
            }
            if (!listHtml) {
                listHtml = `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3"><div class="font-bold text-slate-400 text-[15px]">СПИСОК ПУСТ</div></div>`;
            }
            touristsEl.innerHTML = listHtml;
        } else {
            tourists.forEach((t, i) => {
                if (!t.fullName && !t.dob && t.age === undefined && t.year === undefined) return; // Пропуск пустых строк
                
                // Рассчитываем возраст
                let age = null;
                if (t.age !== undefined) {
                    age = t.age;
                } else if (t.year !== undefined) {
                    const visitYear = visitDateStr ? new Date(visitDateStr).getFullYear() : new Date().getFullYear();
                    age = visitYear - t.year;
                } else {
                    age = calculateAge(t.dob, visitDateStr);
                }

                let category = t.category;
                if (!t.categoryManuallySet || !category) {
                    category = getPassengerCategory(age, t.gender, visitDateStr);
                }

                const basePrice = getBasePrice(visitDateStr, clientType, tariffType, category, age);
                const discountInfo = calculateDiscount(t.dob, visitDateStr, t.disability, age, t.gender, category);
                let discountPercent = discountInfo.percent || 0;
                
                const earlyBookingEnabled = earlyBookingToggle ? earlyBookingToggle.checked : false;
                
                if (category === 'INV') {
                    discountPercent = 100;
                }
                
                // Акция Раннего Бронирования (15%) не действует на инвалидов, именинников и пенсионеров
                const hasOtherDiscounts = discountInfo.isBirthday || discountInfo.isPensioner || (t.disability && t.disability !== '0' && t.disability !== 'none');
                if (earlyBookingEnabled && !hasOtherDiscounts && discountPercent < 100 && age >= 4) {
                    discountPercent = Math.max(discountPercent, CONFIG.discounts.earlyBooking);
                }
                
                let finalPrice = 0;
                if (basePrice > 0) {
                    finalPrice = basePrice * (1 - discountPercent / 100);
                }

                // Форматируем ДР/возраст/год
                let formattedDob = '';
                if (t.dob) {
                    formattedDob = formatDate(t.dob);
                } else if (t.year !== undefined) {
                    formattedDob = `${t.year} г.`;
                } else if (t.age !== undefined) {
                    formattedDob = `${t.age} лет`;
                }

                const priceStr = basePrice === -1 ? 'Нет тарифа' : `${Math.round(finalPrice).toLocaleString('ru-RU')} ₸`;

                touristsEl.innerHTML += `
                    <div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-3 tourist-row">
                        <div class="flex-1 pr-4">
                            <div class="font-bold text-[#1e293b] text-[15px] leading-relaxed break-words">
                                ${(t.fullName || 'Гость ' + (i+1)).toUpperCase()} 
                                ${formattedDob ? '- ' + formattedDob : ''} 
                                <span class="text-xs text-slate-500 font-medium ml-1">(${category})</span>
                            </div>
                        </div>
                        <div class="text-right font-bold text-[#0076ba] text-[15px] shrink-0">
                            ${priceStr}
                        </div>
                    </div>
                `;
            });
        }
        
        const receiptTotalValue = document.getElementById('receiptTotalValue');
        if (receiptTotalValue && totalPriceEl) {
            receiptTotalValue.textContent = totalPriceEl.textContent;
        }

    }

    function generateReceiptImage() {
        if (!validateAccompaniment()) return;
        saveToHistory(); // Сохраняем перед генерацией чека
        const container = document.getElementById('receiptContainer');
        const content = document.getElementById('receiptContent');
        const formattedDate = visitDateInput ? visitDateInput.value : 'date';
        
        // Сбор данных вынесен в отдельную функцию, чтобы переиспользовать в share
        fillReceiptData();
        
        // Временно достаем блок для рендера
        content.classList.remove('opacity-0', 'pointer-events-none');
        document.body.appendChild(content); 
        content.style.position = 'fixed';
        content.style.top = '0';
        content.style.left = '0';
        content.style.zIndex = '-9999';
        
        const originalBtnHtml = downloadReceiptBtn.innerHTML;
        downloadReceiptBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Создание...';
        
        html2canvas(content, { 
            scale: 2, 
            backgroundColor: '#ffffff'
        }).then(canvas => {
            content.style.position = '';
            content.style.top = '';
            content.style.left = '';
            content.style.zIndex = '';
            content.classList.add('opacity-0', 'pointer-events-none');
            container.appendChild(content);
            
            const link = document.createElement('a');
            link.download = `TetysBlu_Check_${formattedDate}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            downloadReceiptBtn.innerHTML = originalBtnHtml;
            window.showToast('Чек успешно сохранен!', 'fa-circle-check');
        }).catch(err => {
            console.error('Ошибка создания чека', err);
            downloadReceiptBtn.innerHTML = originalBtnHtml;
            window.showToast('Ошибка при создании чека', 'fa-triangle-exclamation', 'bg-red-500');
            
            // Возврат элемента на место в случае ошибки
            content.style.position = '';
            content.style.top = '';
            content.style.left = '';
            content.classList.add('opacity-0', 'pointer-events-none');
            container.appendChild(content);
        });
    }

    // --- TOAST NOTIFICATIONS ---
    window.showToast = function(message, icon = 'fa-check', bgClass = 'bg-[#1ebd5a]') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${bgClass} text-white px-5 py-3 rounded-2xl shadow-xl flex items-center font-bold text-sm`;
        toast.innerHTML = `<i class="fa-solid ${icon} mr-2.5 text-lg"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => { 
            if (toast.parentNode) toast.parentNode.removeChild(toast); 
        }, 3000);
    };

    // --- ИСТОРИЯ РАСЧЕТОВ ---
    const historyBtn = document.getElementById('historyBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyModal = document.getElementById('historyModal');
    const historyModalContent = document.getElementById('historyModalContent');
    const historyList = document.getElementById('historyList');
    
    const historyFilterDateFrom = document.getElementById('historyFilterDateFrom');
    const historyFilterDateTo = document.getElementById('historyFilterDateTo');
    const historyFilterStatus = document.getElementById('historyFilterStatus');

    // --- ЗАЯВКИ ОТ КЛИЕНТОВ ---
    const requestsBtn = document.getElementById('requestsBtn');
    const closeRequestsBtn = document.getElementById('closeRequestsBtn');
    const requestsModal = document.getElementById('requestsModal');
    const requestsModalContent = document.getElementById('requestsModalContent');
    const requestsList = document.getElementById('requestsList');
    
    const requestsFilterDateFrom = document.getElementById('requestsFilterDateFrom');
    const requestsFilterDateTo = document.getElementById('requestsFilterDateTo');
    const requestsFilterStatus = document.getElementById('requestsFilterStatus');
    const requestsPingBadge = document.getElementById('requestsPingBadge');

    const statisticsBtn = document.getElementById('statisticsBtn');
    const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const statisticsModal = document.getElementById('statisticsModal');
    const statisticsModalContent = document.getElementById('statisticsModalContent');
    const statisticsContent = document.getElementById('statisticsContent');

    const SUPABASE_URL = 'https://zlnxvraopnwyfebfhmdj.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_2q7uufBD_85Esjf-1Mwrvg_hItngDPG';
    
    // Инициализируем Supabase, если ключи не являются заглушками
    const supabaseClient = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'ВАШ_SUPABASE_URL_ЗДЕСЬ') 
        ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
        : null;

    const historyDB = typeof localforage !== 'undefined' ? localforage.createInstance({
        name: "TetysBluCalc",
        storeName: "history"
    }) : null;

    async function saveToHistory() {
        if (!historyDB) return;
        if (tourists.length === 0 || (!tourists[0].fullName && !tourists[0].dob)) return;
        const total = parseInt(totalPriceEl.textContent.replace(/\D/g, '')) || 0;
        const currentUser = localStorage.getItem('tetysUser') || 'unknown';
        
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            visitDate: visitDateInput ? visitDateInput.value : '',
            clientType: clientTypeInput ? clientTypeInput.value : 'tourist',
            tariffType: tariffTypeInput ? tariffTypeInput.value : 'day',
            totalSum: total,
            tourists: JSON.parse(JSON.stringify(tourists)),
            promocode: promoInput ? promoInput.value.trim().toUpperCase() : '',
            comment: commentInput ? commentInput.value.trim() : '',
            status: 'Оплачено'
        };
        
        try {
            // Сохраняем локально (как бэкап)
            let history = await historyDB.getItem('tetysBluHistory') || [];
            if (history.length > 0) {
                const last = history[0];
                if (JSON.stringify(last.tourists) === JSON.stringify(record.tourists) && last.visitDate === record.visitDate) {
                    return; // Пропуск дубликата
                }
            }
            history.unshift(record);
            await historyDB.setItem('tetysBluHistory', history);
            
            // Отправляем в Supabase
            if (supabaseClient) {
                const { error } = await supabaseClient
                    .from('calculations')
                    .insert([{
                        created_at: record.timestamp,
                        visit_date: record.visitDate,
                        client_type: record.clientType,
                        tariff_type: record.tariffType,
                        total_sum: record.totalSum,
                        tourists: record.tourists,
                        user_login: currentUser + '_paid',
                        promocode: record.promocode,
                        comment: record.comment
                    }]);
                if (error) {
                    console.error("Ошибка Supabase:", error);
                    if(window.showToast) window.showToast('Сохранено локально (ошибка облака)', 'fa-cloud-arrow-down', 'bg-amber-500');
                } else {
                    if(window.showToast) window.showToast('Сохранено в облако', 'fa-cloud-check', 'bg-emerald-500');
                }
            } else {
                if(window.showToast) window.showToast('Сохранено локально (нет облака)', 'fa-check', 'bg-emerald-500');
            }
            
            // Telegram-уведомление при превышении лимита
            if (record.totalSum >= CONFIG.telegram.minSumForAlert) {
                sendTelegramNotification(record, currentUser);
            }

        } catch (err) {
            console.error("Ошибка сохранения в базу:", err);
        }
    }

    async function sendTelegramNotification(record, currentUser) {
        if (!CONFIG.telegram.token || !CONFIG.telegram.chatId) return;
        
        const dateStr = new Date(record.timestamp).toLocaleString('ru-RU');
        const isAgent = record.clientType === 'agent' ? 'Да' : 'Нет';
        
        let message = `💰 *КРУПНАЯ ПРОДАЖА!*\n\n`;
        message += `*Сумма:* ${record.totalSum.toLocaleString('ru-RU')} ₸\n`;
        message += `*Дата визита:* ${record.visitDate}\n`;
        message += `*Гостей:* ${record.tourists.length}\n`;
        message += `*Турагент:* ${isAgent}\n`;
        if (record.promocode) message += `*Промокод:* ${record.promocode}\n`;
        if (record.comment) message += `*Комментарий:* ${record.comment}\n`;
        message += `\n*Кассир:* ${currentUser}\n`;
        message += `*Создано:* ${dateStr}`;

        const url = `https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`;
        
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.telegram.chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error("Ошибка отправки в Telegram:", error);
        }
    }

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            renderHistory();
            historyModal.classList.remove('hidden');
            setTimeout(() => {
                historyModal.classList.remove('opacity-0');
                historyModalContent.classList.remove('translate-x-full');
            }, 10);
        });
    }
    
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.add('opacity-0');
            historyModalContent.classList.add('translate-x-full');
            setTimeout(() => {
                historyModal.classList.add('hidden');
            }, 300);
        });
    }

    if (historyFilterDateFrom) historyFilterDateFrom.addEventListener('change', renderHistory);
    if (historyFilterDateTo) historyFilterDateTo.addEventListener('change', renderHistory);
    if (historyFilterStatus) historyFilterStatus.addEventListener('change', renderHistory);

    // --- ОБРАБОТЧИКИ ЗАЯВОК ---
    if (requestsBtn) {
        requestsBtn.addEventListener('click', () => {
            renderRequests();
            requestsModal.classList.remove('hidden');
            setTimeout(() => {
                requestsModal.classList.remove('opacity-0');
                requestsModalContent.classList.remove('translate-x-full');
            }, 10);
        });
    }
    
    if (closeRequestsBtn) {
        closeRequestsBtn.addEventListener('click', () => {
            requestsModal.classList.add('opacity-0');
            requestsModalContent.classList.add('translate-x-full');
            setTimeout(() => {
                requestsModal.classList.add('hidden');
            }, 300);
        });
    }

    if (requestsFilterDateFrom) requestsFilterDateFrom.addEventListener('change', renderRequests);
    if (requestsFilterDateTo) requestsFilterDateTo.addEventListener('change', renderRequests);
    if (requestsFilterStatus) requestsFilterStatus.addEventListener('change', renderRequests);

    // Initial check and interval for new client requests notification
    checkNewRequests();
    setInterval(checkNewRequests, 30000);

    async function getHistoryData(limit = 0) {
        if (supabaseClient) {
            try {
                let query = supabaseClient.from('calculations').select('*').order('created_at', { ascending: false });
                if (limit > 0) query = query.limit(limit);
                
                const { data, error } = await query;
                if (!error && data) {
                    return data.map(row => ({
                        id: row.id,
                        timestamp: row.created_at,
                        visitDate: row.visit_date,
                        clientType: row.client_type,
                        tariffType: row.tariff_type,
                        totalSum: row.total_sum,
                        tourists: row.tourists,
                        promocode: row.promocode,
                        comment: row.comment,
                        status: row.status || (row.user_login === 'client_form' ? 'Ожидание оплаты' : (row.user_login === 'client_form_declined' || row.user_login === 'declined' ? 'Отказ' : (row.user_login && row.user_login.endsWith('_paid') ? 'Оплачено' : 'Оформлено'))),
                        user_login: row.user_login
                    }));
                }
            } catch(e) {
                console.error("Supabase fetch error:", e);
            }
        }
        // Fallback к локальной базе
        if (historyDB) {
            let hist = await historyDB.getItem('tetysBluHistory') || [];
            if (limit > 0) hist = hist.slice(0, limit);
            return hist;
        }
        return [];
    }

    window.deleteHistoryRecord = async function(id) {
        if (!confirm('Вы действительно хотите удалить этот чек? Это действие нельзя отменить.')) return;
        
        try {
            // Удаляем из Supabase
            if (supabaseClient) {
                const { error } = await supabaseClient.from('calculations').delete().eq('id', id);
                if (error) throw error;
            }
            
            // Удаляем локально
            if (historyDB) {
                let hist = await historyDB.getItem('tetysBluHistory') || [];
                hist = hist.filter(item => String(item.id) !== String(id));
                await historyDB.setItem('tetysBluHistory', hist);
            }
            
            if(window.showToast) window.showToast('Чек успешно удален', 'fa-trash', 'bg-emerald-500');
            renderHistory(); // Перерисовываем список
        } catch (err) {
            console.error('Ошибка удаления:', err);
            if(window.showToast) window.showToast('Ошибка при удалении', 'fa-triangle-exclamation', 'bg-red-500');
        }
    };

    window.updateHistoryStatus = async function(id, status) {
        try {
            // Обновляем в Supabase (безопасно, чтобы не упасть, если колонки еще нет)
            if (supabaseClient) {
                try {
                    let userLoginVal = 'unknown';
                    if (status === 'Заявка' || status === 'Ожидание оплаты') {
                        userLoginVal = 'client_form';
                    } else if (status === 'Отказ') {
                        userLoginVal = 'client_form_declined';
                    } else if (status === 'Оплачено') {
                        let baseUser = localStorage.getItem('tetysUser') || 'unknown';
                        if (baseUser.endsWith('_paid')) baseUser = baseUser.replace('_paid', '');
                        userLoginVal = baseUser + '_paid';
                    } else if (status === 'Оформлено') {
                        let baseUser = localStorage.getItem('tetysUser') || 'unknown';
                        if (baseUser.endsWith('_paid')) baseUser = baseUser.replace('_paid', '');
                        userLoginVal = baseUser;
                    }

                    const { error } = await supabaseClient
                        .from('calculations')
                        .update({ status: status, user_login: userLoginVal })
                        .eq('id', id);
                    if (error) {
                        // Если колонка status отсутствует, обновляем только user_login для совместимости
                        const { error: error2 } = await supabaseClient
                            .from('calculations')
                            .update({ user_login: userLoginVal })
                            .eq('id', id);
                        if (error2) {
                            console.error("Supabase fallback status update error:", error2);
                        }
                    }
                } catch(e) {
                    console.warn("Supabase status update exception:", e);
                }
            }
            
            // Обновляем локально
            if (historyDB) {
                let hist = await historyDB.getItem('tetysBluHistory') || [];
                hist = hist.map(item => {
                    if (String(item.id) === String(id)) {
                        return { ...item, status: status };
                    }
                    return item;
                });
                await historyDB.setItem('tetysBluHistory', hist);
            }
            
            if(window.showToast) window.showToast('Статус обновлен на: ' + status, 'fa-check', 'bg-emerald-500');
            renderHistory();
        } catch (err) {
            console.error('Ошибка обновления статуса:', err);
            if(window.showToast) window.showToast('Ошибка обновления статуса', 'fa-triangle-exclamation', 'bg-red-500');
        }
    };

    async function renderHistory() {
        if (!historyList) return;
        try {
            // Для UI истории загружаем все записи, чтобы фильтрация работала по всей базе
            let history = await getHistoryData(0);
            
            // В архиве не показываем заявки в ожидании оплаты
            history = history.filter(item => item.status !== 'Ожидание оплаты');
            
            // Фильтрация по датам выгрузки (timestamp)
            const dateFromVal = historyFilterDateFrom ? historyFilterDateFrom.value : '';
            const dateToVal = historyFilterDateTo ? historyFilterDateTo.value : '';
            const statusFilterVal = historyFilterStatus ? historyFilterStatus.value : 'all';
            
            if (dateFromVal) {
                const dateFrom = new Date(dateFromVal + 'T00:00:00');
                history = history.filter(item => new Date(item.timestamp) >= dateFrom);
            }
            if (dateToVal) {
                const dateTo = new Date(dateToVal + 'T23:59:59');
                history = history.filter(item => new Date(item.timestamp) <= dateTo);
            }
            if (statusFilterVal && statusFilterVal !== 'all') {
                history = history.filter(item => (item.status || 'Оформлено') === statusFilterVal);
            }
            
            if (history.length === 0) {
                historyList.innerHTML = '<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-folder-open text-3xl mb-3 opacity-50"></i><p class="text-sm font-semibold">Заявки не найдены</p></div>';
                return;
            }
            
            const currentUser = localStorage.getItem('tetysUser');
            
            historyList.innerHTML = '';
            history.forEach(item => {
                const date = new Date(item.timestamp);
                const timeStr = `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')} в ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                
                const card = document.createElement('div');
                let cardClass = '';
                let pingBadge = '';
                
                if (item.status === 'Оплачено') {
                    cardClass = 'bg-cyan-50/50 p-4 rounded-2xl border-l-4 border-l-cyan-500 border border-cyan-200 shadow-sm flex flex-col space-y-2 relative transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                    `;
                } else if (item.status === 'Отказ') {
                    cardClass = 'bg-slate-100/60 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-2 relative opacity-70 transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                        </span>
                    `;
                } else {
                    cardClass = 'bg-white bg-gradient-to-r from-emerald-50/10 to-white p-4 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm flex flex-col space-y-2 relative transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    `;
                }
                card.className = cardClass;

                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">${timeStr}</span>
                        <span class="text-xs font-black text-[#1e293b]">${item.totalSum.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="text-sm font-bold text-slate-800">Гостей: ${item.tourists.length}</div>
                    <div class="text-[11px] font-semibold text-slate-500 mb-1">Визит: ${item.visitDate} • ${item.clientType === 'agent' ? 'Турагент' : 'Турист'}</div>
                    ${item.promocode ? `<div class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1"><i class="fa-solid fa-ticket mr-1"></i> ${item.promocode}</div>` : ''}
                    ${item.comment ? `<div class="text-[10px] text-slate-500 italic mb-1"><i class="fa-regular fa-comment-dots mr-1"></i> ${item.comment}</div>` : ''}
                    


                    <button class="mt-2 w-full bg-blue-50 text-brand-blue hover:bg-brand-blue hover:text-white py-2 rounded-xl text-xs font-bold transition-all hover-lift load-btn">
                        <i class="fa-solid fa-download mr-1.5"></i>Загрузить расчет
                    </button>
                    ${currentUser === 'admin' ? `
                    <button onclick="deleteHistoryRecord('${item.id}')" class="mt-2 w-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-1.5 rounded-xl text-[10px] font-bold transition-colors">
                        <i class="fa-solid fa-trash mr-1"></i>Удалить
                    </button>
                    ` : ''}
                `;
                
                const loadBtn = card.querySelector('.load-btn');
                loadBtn.addEventListener('click', () => {
                    if (visitDateInput) visitDateInput.value = item.visitDate;
                    if (clientTypeInput) clientTypeInput.value = item.clientType;
                    if (tariffTypeInput) tariffTypeInput.value = item.tariffType;
                    tourists = item.tourists;
                    render();
                    if(window.showToast) window.showToast('Расчет успешно загружен', 'fa-folder-open', 'bg-brand-blue');
                    closeHistoryBtn.click();
                });
                
                historyList.appendChild(card);
            });
        } catch(err) {
            console.error("Ошибка загрузки истории:", err);
            historyList.innerHTML = '<div class="text-center text-red-400 py-10"><p>Ошибка загрузки архива</p></div>';
        }
    }

    let knownPendingRequestIds = new Set();
    let isFirstCheck = true;

    async function checkNewRequests() {
        if (!supabaseClient) return;
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data, error } = await supabaseClient
                .from('calculations')
                .select('id, status, user_login')
                .gt('created_at', sevenDaysAgo.toISOString());
            
            if (!error && data) {
                const pendingRequests = data.filter(row => {
                    const status = row.status || (row.user_login === 'client_form' ? 'Ожидание оплаты' : 'Другое');
                    return status === 'Ожидание оплаты' && String(row.user_login).startsWith('client_form');
                });
                
                let hasNew = false;
                pendingRequests.forEach(req => {
                    if (!knownPendingRequestIds.has(req.id)) {
                        hasNew = true;
                        knownPendingRequestIds.add(req.id);
                    }
                });
                
                // Очистка старых ID (чтобы не копились)
                const currentPendingIds = new Set(pendingRequests.map(r => r.id));
                for (let id of knownPendingRequestIds) {
                    if (!currentPendingIds.has(id)) {
                        knownPendingRequestIds.delete(id);
                    }
                }
                
                if (hasNew && !isFirstCheck) {
                    if (window.showToast) window.showToast('Поступила новая заявка от клиента!', 'fa-bell', 'bg-amber-500');
                    if (requestsModal && !requestsModal.classList.contains('hidden')) {
                        renderRequests();
                    }
                }
                isFirstCheck = false;

                if (pendingRequests.length > 0) {
                    if (requestsPingBadge) requestsPingBadge.classList.remove('hidden');
                } else {
                    if (requestsPingBadge) requestsPingBadge.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error("Error checking new requests:", e);
        }
    }

    async function renderRequests() {
        if (!requestsList) return;
        try {
            let history = await getHistoryData(0);
            
            // Фильтруем только заявки, поступившие от клиентов (только ожидающие оплаты)
            // Оплаченные и отказные переходят в архив
            let requests = history.filter(item => {
                return String(item.user_login).startsWith('client_form') && item.status === 'Ожидание оплаты';
            });
            
            const dateFromVal = requestsFilterDateFrom ? requestsFilterDateFrom.value : '';
            const dateToVal = requestsFilterDateTo ? requestsFilterDateTo.value : '';
            const statusFilterVal = requestsFilterStatus ? requestsFilterStatus.value : 'all';
            
            if (dateFromVal) {
                const dateFrom = new Date(dateFromVal + 'T00:00:00');
                requests = requests.filter(item => new Date(item.timestamp) >= dateFrom);
            }
            if (dateToVal) {
                const dateTo = new Date(dateToVal + 'T23:59:59');
                requests = requests.filter(item => new Date(item.timestamp) <= dateTo);
            }
            if (statusFilterVal && statusFilterVal !== 'all') {
                requests = requests.filter(item => item.status === statusFilterVal);
            }
            
            if (requests.length === 0) {
                requestsList.innerHTML = '<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-folder-open text-3xl mb-3 opacity-50"></i><p class="text-sm font-semibold">Заявки не найдены</p></div>';
                return;
            }
            
            const currentUser = localStorage.getItem('tetysUser');
            
            requestsList.innerHTML = '';
            requests.forEach(item => {
                const date = new Date(item.timestamp);
                const timeStr = `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')} в ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                
                const card = document.createElement('div');
                let cardClass = '';
                let pingBadge = '';
                
                if (item.status === 'Ожидание оплаты') {
                    cardClass = 'bg-amber-50/50 p-4 rounded-2xl border-l-4 border-l-amber-500 border border-amber-200 shadow-sm flex flex-col space-y-2 relative transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                    `;
                } else if (item.status === 'Отказ') {
                    cardClass = 'bg-slate-100/60 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-2 relative opacity-70 transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                        </span>
                    `;
                } else { // Оплачено
                    cardClass = 'bg-emerald-50/40 p-4 rounded-2xl border-l-4 border-l-emerald-500 border border-emerald-200 shadow-sm flex flex-col space-y-2 relative transition-all';
                    pingBadge = `
                        <span class="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    `;
                }
                card.className = cardClass;
                
                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">${timeStr}</span>
                        <span class="text-xs font-black text-[#1e293b]">${item.totalSum.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="text-sm font-bold text-slate-800">Гостей: ${item.tourists.length}</div>
                    <div class="text-[11px] font-semibold text-slate-500 mb-1">Визит: ${item.visitDate} • Клиент</div>
                    ${item.comment ? `<div class="text-[10px] text-slate-500 italic mb-1"><i class="fa-regular fa-comment-dots mr-1"></i> ${item.comment}</div>` : ''}
                    
                    <div class="flex items-center justify-end mt-2 pt-2 border-t border-slate-100 mb-2">
                        <button type="button" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm flex items-center archive-btn">
                            <i class="fa-solid fa-check mr-1.5"></i>В архив
                        </button>
                    </div>

                    <button class="mt-2 w-full bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all hover-lift load-btn">
                        <i class="fa-solid fa-download mr-1.5"></i>Загрузить расчет
                    </button>
                    ${currentUser === 'admin' ? `
                    <button onclick="deleteHistoryRecord('${item.id}'); setTimeout(renderRequests, 500);" class="mt-2 w-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-1.5 rounded-xl text-[10px] font-bold transition-colors">
                        <i class="fa-solid fa-trash mr-1"></i>Удалить
                    </button>
                    ` : ''}
                `;
                
                const loadBtn = card.querySelector('.load-btn');
                loadBtn.addEventListener('click', () => {
                    if (visitDateInput) visitDateInput.value = item.visitDate;
                    if (clientTypeInput) clientTypeInput.value = item.clientType;
                    if (tariffTypeInput) tariffTypeInput.value = item.tariffType;
                    tourists = item.tourists;
                    render();
                    if(window.showToast) window.showToast('Расчет успешно загружен', 'fa-folder-open', 'bg-brand-blue');
                    closeRequestsBtn.click();
                });
                
                const archiveBtn = card.querySelector('.archive-btn');
                if (archiveBtn) {
                    archiveBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateRequestStatus(item.id, 'Оплачено');
                    });
                }
                
                requestsList.appendChild(card);
            });
        } catch (e) {
            console.error("Error rendering requests:", e);
        }
    }

    window.updateRequestStatus = async function(id, status) {
        try {
            if (supabaseClient) {
                try {
                    let userLoginVal = 'client_form';
                    if (status === 'Оплачено') userLoginVal = 'client_form_paid';
                    else if (status === 'Отказ') userLoginVal = 'client_form_declined';

                    const { error } = await supabaseClient
                        .from('calculations')
                        .update({ status: status, user_login: userLoginVal })
                        .eq('id', id);
                    if (error) {
                        const { error: error2 } = await supabaseClient
                            .from('calculations')
                            .update({ user_login: userLoginVal })
                            .eq('id', id);
                        if (error2) {
                            console.error("Supabase fallback status update error:", error2);
                        }
                    }
                } catch(e) {
                    console.warn("Supabase status update exception:", e);
                }
            }
            
            // Обновляем локально тоже, чтобы UI сразу отреагировал
            if (historyDB) {
                let hist = await historyDB.getItem('tetysBluHistory') || [];
                hist = hist.map(item => {
                    if (String(item.id) === String(id)) {
                        let newUserLogin = item.user_login;
                        if (status === 'Оплачено') newUserLogin = 'client_form_paid';
                        else if (status === 'Отказ') newUserLogin = 'client_form_declined';
                        return { ...item, status: status, user_login: newUserLogin };
                    }
                    return item;
                });
                await historyDB.setItem('tetysBluHistory', hist);
            }
            
            if(window.showToast) window.showToast('Статус обновлен на: ' + status, 'fa-check', 'bg-emerald-500');
            await renderRequests();
            await checkNewRequests();
            
            // Если архив открыт, обновим его тоже
            if (!historyModal.classList.contains('hidden')) {
                renderHistory();
            }
        } catch (err) {
            console.error('Ошибка обновления статуса заявки:', err);
            if(window.showToast) window.showToast('Ошибка обновления статуса', 'fa-triangle-exclamation', 'bg-red-500');
        }
    };

    function getRecordMetrics(item) {
        let baseSum = 0;
        let totalCost = 0;
        
        if (item.tourists && Array.isArray(item.tourists)) {
            item.tourists.forEach(t => {
                let age = null;
                if (t.age !== undefined) {
                    age = t.age;
                } else if (t.year !== undefined) {
                    const visitYear = item.visitDate ? new Date(item.visitDate).getFullYear() : new Date().getFullYear();
                    age = visitYear - t.year;
                } else if (t.dob) {
                    age = calculateAge(t.dob, item.visitDate);
                }
                
                const category = t.category || getPassengerCategory(age, t.gender, item.visitDate);
                const basePrice = getBasePrice(item.visitDate, item.clientType, item.tariffType, category, age) || 0;
                
                // Получаем себестоимость из тарифов (Net price)
                let costPrice = getBasePrice(item.visitDate, 'net', item.tariffType, category, age) || 0;
                
                // Если пенсионер или инвалид, то себестоимость 50% от базового тарифа
                if (category === 'SNR' || category === 'INV') {
                    const baseNet = getBasePrice(item.visitDate, 'net', item.tariffType, category, age);
                    if (baseNet > 0) {
                        costPrice = baseNet / 2;
                    } else {
                        costPrice = 0;
                    }
                }
                
                // Если нетто-цена не найдена (например, старые записи без даты визита), 
                // мы оставляем 0, чтобы не завышать маржу, либо можно взять минимальную себестоимость.
                // В данном случае лучше оставить как есть или попытаться взять дефолтный сезон.
                if (costPrice === -1 || costPrice === 0) {
                    if (category === 'INF') costPrice = 0;
                    else {
                        // Попытка взять первый доступный тариф как дефолт
                        const defaultPeriod = CONFIG.tariffs[item.tariffType]?.[0];
                        if (defaultPeriod && defaultPeriod.net) {
                            costPrice = defaultPeriod.net[category === 'CHLD' ? 'CHLD' : 'ADL'] || 0;
                        }
                    }
                }
                
                baseSum += basePrice > 0 ? basePrice : 0;
                totalCost += costPrice;
            });
        }
        
        let discountSum = baseSum - item.totalSum;
        if (discountSum < 0) discountSum = 0;
        const profit = item.totalSum - totalCost;
        
        return {
            baseSum: baseSum,
            discountSum: discountSum,
            cost: totalCost,
            profit: profit
        };
    }

    async function calculateStatistics() {
        if (!statisticsContent) return;
        try {
            statisticsContent.innerHTML = '<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3 opacity-50"></i><p class="text-sm font-semibold">Загрузка облачной статистики...</p></div>';
            
            // Загружаем ВСЕ данные для статистики (limit = 0)
            let history = await getHistoryData(0);
            
            // Фильтруем историю — статистика строится только по статусу "Оплачено"
            history = history.filter(item => item.status === 'Оплачено');
            
            if (history.length === 0) {
                statisticsContent.innerHTML = '<div class="text-center text-slate-400 py-10"><i class="fa-solid fa-chart-pie text-3xl mb-3 opacity-50"></i><p class="text-sm font-semibold">Нет оплаченных заявок для статистики</p></div>';
                return;
            }

            let totalRevenue = 0;
            let totalProfit = 0;
            let totalDiscounts = 0;
            let totalClients = 0;
            let currentMonthRevenue = 0;
            
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            history.forEach(item => {
                totalRevenue += item.totalSum;
                totalClients += item.tourists.length;
                
                const metrics = getRecordMetrics(item);
                totalProfit += metrics.profit;
                totalDiscounts += metrics.discountSum;
                
                const d = new Date(item.timestamp);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    currentMonthRevenue += item.totalSum;
                }
            });

            const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

            statisticsContent.innerHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div class="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.15)]">
                        <span class="text-[9px] font-extrabold text-indigo-500/80 uppercase tracking-wider mb-1">Выручка (Всего)</span>
                        <span class="text-base sm:text-lg font-black text-gradient-indigo">${totalRevenue.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                        <span class="text-[9px] font-extrabold text-emerald-600/80 uppercase tracking-wider mb-1">Выручка за месяц</span>
                        <span class="text-base sm:text-lg font-black text-gradient-emerald">${currentMonthRevenue.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.15)]">
                        <span class="text-[9px] font-extrabold text-blue-600/80 uppercase tracking-wider mb-1">Чистая прибыль</span>
                        <span class="text-base sm:text-lg font-black text-gradient-blue">${totalProfit.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                        <span class="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">Маржинальность</span>
                        <span class="text-base sm:text-lg font-black text-gradient-amber">${avgMargin.toFixed(1)}%</span>
                    </div>
                    <div class="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.15)]">
                        <span class="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">Сумма скидок</span>
                        <span class="text-base sm:text-lg font-black text-gradient-rose">${totalDiscounts.toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 flex flex-col justify-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:drop-shadow-[0_0_8px_rgba(100,116,139,0.15)]">
                        <span class="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Обслужено гостей</span>
                        <span class="text-base sm:text-lg font-black text-gradient-slate">${totalClients} чел.</span>
                    </div>
                </div>

                <!-- Выручка vs. Прибыль по дням -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
                    <h3 class="text-xs font-bold text-slate-700 uppercase mb-3"><i class="fa-solid fa-chart-line text-indigo-500 mr-1.5"></i> Выручка vs. Чистая прибыль по дням визита</h3>
                    <div style="height: 200px; position: relative;"><canvas id="revenueProfitChart"></canvas></div>
                </div>
                
                <!-- Круговые диаграммы аналитики -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
                        <h3 class="text-[10px] font-bold text-slate-700 uppercase mb-3 text-center">Типы клиентов (гости)</h3>
                        <div class="w-full flex justify-center h-40"><canvas id="clientTypeChart"></canvas></div>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
                        <h3 class="text-[10px] font-bold text-slate-700 uppercase mb-3 text-center">Возрастные категории</h3>
                        <div class="w-full flex justify-center h-40"><canvas id="ageCategoryChart"></canvas></div>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
                        <h3 class="text-[10px] font-bold text-slate-700 uppercase mb-3 text-center">Прибыль по тарифам</h3>
                        <div class="w-full flex justify-center h-40"><canvas id="tariffProfitChart"></canvas></div>
                    </div>
                </div>

                <div class="text-[10px] text-slate-400 text-center mt-4 uppercase font-bold tracking-widest">
                    Данные на основе ${history.length} оформленных расчетов
                </div>
            `;

            // Агрегация данных для графиков
            const metricsByDate = {};
            let agentCount = 0;
            let touristCount = 0;
            let catCounts = { ADL: 0, CHLD: 0, INF: 0, SNR: 0, INV: 0 };
            const profitByTariff = { day: 0, evening: 0 };

            history.forEach(item => {
                const metrics = getRecordMetrics(item);
                
                // 1. Агрегация по дате визита
                if (item.visitDate) {
                    if (!metricsByDate[item.visitDate]) {
                        metricsByDate[item.visitDate] = { revenue: 0, profit: 0 };
                    }
                    metricsByDate[item.visitDate].revenue += item.totalSum;
                    metricsByDate[item.visitDate].profit += metrics.profit;
                }
                
                // 2. Агрегация по тарифам
                const tariff = item.tariffType || 'day';
                if (profitByTariff[tariff] !== undefined) {
                    profitByTariff[tariff] += metrics.profit;
                }
                
                // 3. Агрегация типов клиентов
                if (item.clientType === 'agent') {
                    agentCount += item.tourists.length;
                } else {
                    touristCount += item.tourists.length;
                }
                
                // 4. Агрегация по категориям гостей
                if (item.tourists && Array.isArray(item.tourists)) {
                    item.tourists.forEach(t => {
                        const cat = t.category || 'ADL';
                        if (catCounts[cat] !== undefined) {
                            catCounts[cat]++;
                        }
                    });
                }
            });

            // Сортировка дат для временного графика
            const sortedDates = Object.keys(metricsByDate).sort((a,b) => new Date(a) - new Date(b));
            const revenueData = sortedDates.map(date => metricsByDate[date].revenue);
            const profitData = sortedDates.map(date => metricsByDate[date].profit);

            // Инициализация графиков с небольшой задержкой
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    // 1. Выручка vs Прибыль
                    const revCtx = document.getElementById('revenueProfitChart');
                    if (revCtx) {
                        new Chart(revCtx, {
                            type: 'bar',
                            data: {
                                labels: sortedDates.map(d => d.slice(5)), // Только MM-DD
                                datasets: [
                                    {
                                        label: 'Выручка ₸',
                                        data: revenueData,
                                        backgroundColor: '#0ea5e9',
                                        borderRadius: 4
                                    },
                                    {
                                        label: 'Чистая прибыль ₸',
                                        data: profitData,
                                        backgroundColor: '#10b981',
                                        borderRadius: 4
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top',
                                        labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } }
                                    }
                                }
                            }
                        });
                    }

                    // 2. Типы клиентов
                    const typeCtx = document.getElementById('clientTypeChart');
                    if (typeCtx) {
                        new Chart(typeCtx, {
                            type: 'doughnut',
                            data: {
                                labels: ['Агенты', 'Туристы'],
                                datasets: [{
                                    data: [agentCount, touristCount],
                                    backgroundColor: ['#8b5cf6', '#10b981'],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { boxWidth: 8, font: { size: 9 } }
                                    }
                                }
                            }
                        });
                    }

                    // 3. Возрастные категории
                    const ageCtx = document.getElementById('ageCategoryChart');
                    if (ageCtx) {
                        new Chart(ageCtx, {
                            type: 'pie',
                            data: {
                                labels: ['Взрослые', 'Дети', 'Младенцы', 'Пенсионеры', 'Инвалиды'],
                                datasets: [{
                                    data: [catCounts.ADL, catCounts.CHLD, catCounts.INF, catCounts.SNR, catCounts.INV],
                                    backgroundColor: ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { boxWidth: 8, font: { size: 9 } }
                                    }
                                }
                            }
                        });
                    }

                    // 4. Прибыль по тарифам
                    const tariffCtx = document.getElementById('tariffProfitChart');
                    if (tariffCtx) {
                        new Chart(tariffCtx, {
                            type: 'doughnut',
                            data: {
                                labels: ['Дневной', 'Вечерний'],
                                datasets: [{
                                    data: [profitByTariff.day, profitByTariff.evening],
                                    backgroundColor: ['#0076ba', '#f43f5e'],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { boxWidth: 8, font: { size: 9 } }
                                    }
                                }
                            }
                        });
                    }
                }
            }, 100);

        } catch(err) {
            console.error(err);
            statisticsContent.innerHTML = '<div class="text-center text-red-400 py-10"><p>Ошибка загрузки статистики</p></div>';
        }
    }

    async function exportToExcel() {
        if (typeof ExcelJS === 'undefined') {
            if(window.showToast) window.showToast('Библиотека Excel не загружена', 'fa-triangle-exclamation', 'bg-red-500');
            return;
        }

        try {
            let history = await getHistoryData(0);
            
            if (history.length === 0) {
                if(window.showToast) window.showToast('Архив пуст', 'fa-triangle-exclamation', 'bg-amber-500');
                return;
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Tetys Blu';
            workbook.created = new Date();
            
            const sheet = workbook.addWorksheet('Отчет по продажам');

            // Настраиваем колонки с шириной
            sheet.columns = [
                { header: 'Дата создания', key: 'createdAt', width: 15 },
                { header: 'Дата визита', key: 'visitDate', width: 15 },
                { header: 'Тип клиента', key: 'clientType', width: 15 },
                { header: 'Тариф', key: 'tariffType', width: 15 },
                { header: 'Взрослые (ADL)', key: 'adl', width: 18 },
                { header: 'Дети (CHLD)', key: 'chld', width: 15 },
                { header: 'Всего гостей', key: 'guests', width: 15 },
                { header: 'Базовая сумма (₸)', key: 'baseSum', width: 18 },
                { header: 'Сумма со скидкой (₸)', key: 'totalSum', width: 22 },
                { header: 'Себестоимость (₸)', key: 'cost', width: 18 },
                { header: 'Валовая прибыль (₸)', key: 'profit', width: 22 }
            ];

            // Красивый заголовок
            const headerRow = sheet.getRow(1);
            headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0EA5E9' } // фирменный голубой
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            headerRow.height = 30;

            // Добавляем данные
            history.forEach(item => {
                const date = new Date(item.timestamp);
                const dStr = `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getFullYear()}`;
                const typeStr = item.clientType === 'agent' ? 'Турагент' : 'Турист';
                
                let adl=0, chld=0, inf=0, snr=0, inv=0;
                if (item.tourists && Array.isArray(item.tourists)) {
                    item.tourists.forEach(t => {
                        const cat = t.category || 'ADL';
                        if (cat === 'ADL') adl++;
                        if (cat === 'CHLD') chld++;
                        if (cat === 'INF') inf++;
                        if (cat === 'SNR') snr++;
                        if (cat === 'INV') inv++;
                    });
                }
                
                const metrics = getRecordMetrics(item);

                const row = sheet.addRow({
                    createdAt: dStr,
                    visitDate: item.visitDate,
                    clientType: typeStr,
                    tariffType: item.tariffType,
                    adl: adl + snr + inv, // Объединяем взрослых с пенсионерами/инвалидами для простоты
                    chld: chld,
                    guests: item.tourists.length,
                    baseSum: metrics.baseSum,
                    totalSum: item.totalSum,
                    cost: metrics.cost,
                    profit: metrics.profit
                });

                // Выравнивание и перенос текста для ячеек
                row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                
                // Форматируем финансовые ячейки
                row.getCell('baseSum').numFmt = '#,##0 ₸';
                row.getCell('totalSum').font = { bold: true, color: { argb: 'FF16A34A' } };
                row.getCell('totalSum').numFmt = '#,##0 ₸';
                row.getCell('cost').numFmt = '#,##0 ₸';
                row.getCell('profit').font = { bold: true, color: { argb: 'FF0EA5E9' } };
                row.getCell('profit').numFmt = '#,##0 ₸';
            });

            // Добавляем границы ко всем ячейкам
            sheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: {style:'thin', color: {argb:'FFDDDDDD'}},
                        left: {style:'thin', color: {argb:'FFDDDDDD'}},
                        bottom: {style:'thin', color: {argb:'FFDDDDDD'}},
                        right: {style:'thin', color: {argb:'FFDDDDDD'}}
                    };
                });
            });

            // Генерируем и скачиваем файл
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `TetysBlu_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            if(window.showToast) window.showToast('Отчет Excel успешно создан', 'fa-file-excel', 'bg-emerald-500');
        } catch(err) {
            console.error('Excel Export Error:', err);
            if(window.showToast) window.showToast('Ошибка создания отчета', 'fa-triangle-exclamation', 'bg-red-500');
        }
    }

    if (statisticsBtn) {
        statisticsBtn.addEventListener('click', () => {
            calculateStatistics();
            statisticsModal.classList.remove('hidden');
            setTimeout(() => {
                statisticsModal.classList.remove('opacity-0');
                statisticsModalContent.classList.remove('scale-95');
            }, 10);
        });
    }

    if (closeStatisticsBtn) {
        closeStatisticsBtn.addEventListener('click', () => {
            statisticsModal.classList.add('opacity-0');
            statisticsModalContent.classList.add('scale-95');
            setTimeout(() => {
                statisticsModal.classList.add('hidden');
            }, 300);
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToExcel);
    }

    // --- PWA INSTALLATION LOGIC ---
    let deferredPrompt;
    const installPwaBtn = document.getElementById('installPwaBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installPwaBtn) installPwaBtn.classList.remove('hidden');
    });

    if (installPwaBtn) {
        installPwaBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installPwaBtn.classList.add('hidden');
                }
                deferredPrompt = null;
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        if (installPwaBtn) installPwaBtn.classList.add('hidden');
        if (window.showToast) window.showToast('Приложение установлено!', 'fa-check', 'bg-emerald-500');
    });

    function initApp() {
        const draft = localStorage.getItem('tetisBluDraft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (visitDateInput && data.visitDate) visitDateInput.value = data.visitDate;
                if (clientTypeInput && data.clientType) clientTypeInput.value = data.clientType;
                if (tariffTypeInput && data.tariffType) tariffTypeInput.value = data.tariffType;
                if (data.currentCalcMode) currentCalcMode = data.currentCalcMode;
                if (data.quickCounts) {
                    Object.assign(quickCounts, data.quickCounts);
                }
                if (promoInput && data.promo) promoInput.value = data.promo;
                if (commentInput && data.comment) commentInput.value = data.comment;
                
                if (data.tourists && Array.isArray(data.tourists)) {
                    tourists = data.tourists;
                }
            } catch (e) {
                console.error("Error parsing draft:", e);
            }
        }
        
        if (tourists.length === 0) {
            addTourist();
        }
        
        switchCalcMode(currentCalcMode);
        checkNewRequests();
    }

    // Инициализация при загрузке
    initApp();

});





