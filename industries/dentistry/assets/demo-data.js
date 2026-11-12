/* ============================================================
   SMILA — dental growth ecosystem demo data layer
   KINETIA Industry Solutions · DEMO MODE — умовні дані

   One shared store for: clinic website, booking flow, CRM,
   automation centre, marketing dashboards, growth presentation.
   Persistence: localStorage. No network calls. No real messages.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'kinetia_dentistry_demo_v1';
  var ADMIN_KEY = 'kinetia_dentistry_admin_v1';

  /* ---------- brand / clinic (fictional placeholders) ---------- */
  var CLINIC = {
    name: 'SMILA',
    full: 'SMILA Dental Studio',
    tagline: 'Стоматологія, до якої повертаються',
    phone: '+380 44 000 00 00',
    phoneHref: 'tel:+380440000000',
    email: 'hello@smila-demo.example',
    address: 'м. Київ, вул. Демонстраційна, 12',
    district: 'Печерський район',
    hours: [
      { d: 'Пн–Пт', t: '09:00 — 20:00' },
      { d: 'Сб', t: '10:00 — 17:00' },
      { d: 'Нд', t: 'За записом' }
    ],
    mapNote: 'Орієнтир: 4 хвилини від метро, паркінг у дворі',
    demoNotice: 'Демонстраційний сайт. Клініка, лікарі, адреса, ціни та відгуки — вигадані. Це не медичний заклад і не медична консультація.'
  };

  /* ---------- services (configurable) ---------- */
  var SERVICES = [
    {
      id: 'general', slug: 'general', cat: 'Консультація', enabled: true,
      title: 'Загальна стоматологія', short: 'Огляд і план лікування',
      priceFrom: 0, priceNote: 'Первинна консультація — демо-ціна 0 ₴',
      duration: 40, doctors: ['iryna', 'dmytro'],
      lead: 'Спокійний початок: огляд, пояснення варіантів і зрозумілий план без нав\'язування.',
      summary: 'Первинний прийом потрібен, коли ви давно не були в стоматолога, маєте питання щодо стану зубів або хочете зрозуміти послідовність лікування. Лікар проводить огляд, фіксує запит і пояснює можливі варіанти. Остаточні клінічні рішення ухвалюються лише на прийомі.',
      bullets: ['Огляд порожнини рота', 'Обговорення запиту та очікувань', 'Письмовий план етапів', 'Направлення до профільного лікаря за потреби'],
      process: [
        { t: 'Запис', d: 'Оберіть зручний час і лікаря. Адміністратор підтвердить візит.' },
        { t: 'Знайомство', d: 'Коротка розмова про запит і попередні візити.' },
        { t: 'Огляд', d: 'Лікар оглядає порожнину рота та пояснює побачене.' },
        { t: 'План', d: 'Ви отримуєте етапи, орієнтовні строки й демо-вартість.' }
      ],
      expect: ['Прийдіть за 10 хвилин до початку.', 'Візьміть список ліків, які приймаєте, якщо він є.', 'Скажіть адміністратору про зручний канал зв\'язку.'],
      faq: [
        { q: 'Чи можна прийти без попереднього запису?', a: 'Демо-клініка працює за записом. Невідкладні стани приймаються окремо.' },
        { q: 'Чи дає сайт медичні рекомендації?', a: 'Ні. Сайт допомагає обрати напрям і залишити заявку. Клінічні рекомендації надає лікар на прийомі.' },
        { q: 'Чи є розстрочка?', a: 'У демо-версії це поле-заглушка. Реальні умови оплати клініка визначає самостійно.' }
      ]
    },
    {
      id: 'hygiene', slug: 'hygiene', cat: 'Гігієна', enabled: true,
      title: 'Професійна гігієна', short: 'Профілактичне очищення',
      priceFrom: 1800, priceNote: 'Демо-ціна від 1 800 ₴',
      duration: 60, doctors: ['iryna', 'marta'],
      lead: 'Профілактичний візит, який допомагає підтримувати стан порожнини рота між основними лікуваннями.',
      summary: 'Професійна гігієна — планова процедура очищення поверхонь зубів і міжзубних проміжків. Обсяг і періодичність визначає лікар після огляду. Демо-сторінка описує загальний процес і не замінює консультацію.',
      bullets: ['Огляд і фіксація запиту', 'Видалення м\'якого нальоту', 'Полірування поверхонь', 'Індивідуальні поради догляду'],
      process: [
        { t: 'Огляд', d: 'Лікар оцінює стан ясен і поверхонь зубів.' },
        { t: 'Очищення', d: 'Процедура виконується за показаннями та комфортом пацієнта.' },
        { t: 'Полірування', d: 'Завершальний етап для гладкості поверхонь.' },
        { t: 'Догляд', d: 'Обговорення домашнього догляду без нав\'язування продуктів.' }
      ],
      expect: ['Повідомте про чутливість заздалегідь.', 'Не плануйте важливу розмову одразу після візиту.', 'Уточніть періодичність наступного візиту у лікаря.'],
      faq: [
        { q: 'Як часто потрібна гігієна?', a: 'Періодичність визначає лікар індивідуально. Сайт не встановлює клінічних норм.' },
        { q: 'Чи буде боляче?', a: 'Відчуття залежать від стану ясен і чутливості. Обговоріть це з лікарем до початку.' },
        { q: 'Чи входить відбілювання?', a: 'Ні, це окремий напрям. У демо-конфігурації він не підключений.' }
      ]
    },
    {
      id: 'therapy', slug: 'therapy', cat: 'Лікування', enabled: true,
      title: 'Терапевтична стоматологія', short: 'Лікування карієсу та відновлення',
      priceFrom: 2400, priceNote: 'Демо-ціна від 2 400 ₴',
      duration: 75, doctors: ['iryna'],
      lead: 'Лікування пошкоджених тканин зуба з урахуванням індивідуальної клінічної картини.',
      summary: 'Терапевтичний напрям охоплює лікування карієсу та відновлення форми зуба. Показання, обсяг і матеріали визначає лікар після огляду та, за потреби, діагностики. Сторінка описує загальний підхід, а не конкретне лікування.',
      bullets: ['Клінічний огляд', 'Обговорення варіантів', 'Анестезія за показаннями', 'Контрольний візит'],
      process: [
        { t: 'Діагностика', d: 'Лікар визначає обсяг після огляду.' },
        { t: 'План', d: 'Пояснення варіантів і демо-вартості.' },
        { t: 'Лікування', d: 'Виконується на прийомі за погодженим планом.' },
        { t: 'Контроль', d: 'Короткий візит для перевірки результату.' }
      ],
      expect: ['Повідомте про алергії та ліки.', 'Уточніть час на відновлення.', 'Поставте питання до початку процедури.'],
      faq: [
        { q: 'Чи можна вилікувати зуб за один візит?', a: 'Іноді так, іноді потрібно кілька етапів. Це визначає лікар.' },
        { q: 'Чи боляче лікувати?', a: 'Сучасні підходи передбачають знеболення за показаннями. Обговоріть комфорт із лікарем.' },
        { q: 'Чи даєте ви гарантію?', a: 'Демо-сторінка не містить гарантійних умов. Це питання клініки та договору.' }
      ]
    },
    {
      id: 'endo', slug: 'endodontics', cat: 'Лікування', enabled: true,
      title: 'Ендодонтія', short: 'Робота з кореневими каналами',
      priceFrom: 5200, priceNote: 'Демо-ціна від 5 200 ₴',
      duration: 120, doctors: ['iryna'],
      lead: 'Напрям для ситуацій, коли лікар ухвалює рішення про лікування кореневих каналів.',
      summary: 'Ендодонтичне лікування потребує діагностики та клінічного рішення. Демо-сторінка пояснює загальні етапи й допомагає записатися на консультацію. Вона не визначає показання самостійно.',
      bullets: ['Консультація та діагностика', 'Планування етапів', 'Лікування за показаннями', 'Подальше відновлення зуба'],
      process: [
        { t: 'Оцінка', d: 'Лікар визначає потребу в діагностиці.' },
        { t: 'План', d: 'Обговорення етапів і строків.' },
        { t: 'Лікування', d: 'Може потребувати кількох візитів.' },
        { t: 'Відновлення', d: 'Окремий етап відновлення форми зуба.' }
      ],
      expect: ['Візьміть попередні знімки, якщо вони є.', 'Уточніть кількість візитів.', 'Спитайте про варіанти відновлення.'],
      faq: [
        { q: 'Скільки візитів потрібно?', a: 'Залежить від клінічної ситуації. Це визначає лікар.' },
        { q: 'Чи завжди потрібно видаляти нерв?', a: 'Ні. Рішення ухвалюється за показаннями після огляду.' },
        { q: 'Чи можна зробити все одразу?', a: 'Іноді ні. Лікар пояснить послідовність етапів.' }
      ]
    },
    {
      id: 'ortho', slug: 'orthodontics', cat: 'Ортодонтія', enabled: true,
      title: 'Ортодонтія', short: 'Консультація щодо прикусу',
      priceFrom: 900, priceNote: 'Демо-консультація від 900 ₴',
      duration: 45, doctors: ['sofia'],
      lead: 'Консультація ортодонта для обговорення прикусу, варіантів і подальших кроків.',
      summary: 'Ортодонтичний напрям починається з консультації та діагностики. Варіанти можуть відрізнятися за строком, комфортом і бюджетом. Демо-сторінка не обіцяє результатів і не замінює огляд.',
      bullets: ['Консультація ортодонта', 'Оцінка запиту', 'Пояснення варіантів', 'План діагностики'],
      process: [
        { t: 'Запис', d: 'Оберіть консультацію в ортодонта.' },
        { t: 'Огляд', d: 'Лікар оцінює запит і пропонує діагностику.' },
        { t: 'Варіанти', d: 'Обговорення підходів і демо-строків.' },
        { t: 'Старт', d: 'Подальші етапи — після погодження плану.' }
      ],
      expect: ['Підготуйте питання.', 'Уточніть, чи потрібні знімки.', 'Обговоріть очікування та обмеження.'],
      faq: [
        { q: 'Чи підходять мені брекети?', a: 'Це визначає ортодонт після діагностики.' },
        { q: 'Скільки триває лікування?', a: 'Демо-сторінка не дає прогнозів. Строки індивідуальні.' },
        { q: 'Чи є альтернативи?', a: 'Варіанти обговорюються на консультації.' }
      ]
    },
    {
      id: 'implants', slug: 'implants', cat: 'Імплантація', enabled: true,
      title: 'Дентальна імплантація', short: 'Консультація щодо імплантів',
      priceFrom: 18000, priceNote: 'Демо-ціна від 18 000 ₴',
      duration: 90, doctors: ['oleh'],
      lead: 'Структурована консультація щодо відновлення відсутніх зубів — без обіцянок результату.',
      summary: 'Імплантація — один із варіантів відновлення відсутнього зуба. Рішення потребує діагностики, оцінки протипоказань і обговорення альтернатив. Демо-консультація допомагає зрозуміти процес і поставити питання.',
      bullets: ['Консультація імплантолога', 'Огляд і діагностика', 'Обговорення альтернатив', 'Етапи та демо-вартість'],
      process: [
        { t: 'Консультація', d: 'Оцінка запиту та медичного контексту.' },
        { t: 'Діагностика', d: 'За потреби призначаються дослідження.' },
        { t: 'План', d: 'Етапність, строки, орієнтовна вартість.' },
        { t: 'Супровід', d: 'Контрольні візити за планом лікаря.' }
      ],
      expect: ['Візьміть попередні дослідження.', 'Будьте готові обговорити історію здоров\'я з лікарем.', 'Не покладайтеся на ціну з сайту як на остаточну.'],
      faq: [
        { q: 'Чи завжди можна ставити імплант?', a: 'Ні. Є показання та протипоказання, які оцінює лікар.' },
        { q: 'Скільки етапів?', a: 'Залежить від ситуації. План складається індивідуально.' },
        { q: 'Чи можна одразу отримати коронку?', a: 'Це визначає лікар за клінічними показаннями.' }
      ]
    },
    {
      id: 'prosthetics', slug: 'prosthetics', cat: 'Протезування', enabled: true,
      title: 'Протезування', short: 'Відновлення форми та функції',
      priceFrom: 7600, priceNote: 'Демо-ціна від 7 600 ₴',
      duration: 60, doctors: ['dmytro'],
      lead: 'Консультація ортопеда щодо відновлення зубів коронками, вкладками або іншими конструкціями.',
      summary: 'Ортопедичне лікування відновлює форму та функцію зубів. Вибір конструкції залежить від клінічної картини. Демо-сторінка описує загальний процес і пропонує консультацію.',
      bullets: ['Консультація ортопеда', 'Оцінка наявних відновлень', 'Варіанти конструкцій', 'Етапи виготовлення'],
      process: [
        { t: 'Огляд', d: 'Оцінка стану опорних зубів.' },
        { t: 'Варіанти', d: 'Обговорення конструкцій і матеріалів.' },
        { t: 'Підготовка', d: 'Етапи за погодженим планом.' },
        { t: 'Фіксація', d: 'Завершальний етап і контроль.' }
      ],
      expect: ['Уточніть кількість візитів.', 'Обговоріть догляд за конструкцією.', 'Спитайте про альтернативи.'],
      faq: [
        { q: 'Коронка чи вкладка?', a: 'Вибір залежить від ступеня руйнування зуба.' },
        { q: 'Скільки часу займає?', a: 'Строки залежать від конструкції та лабораторії.' },
        { q: 'Чи можна відремонтувати стару коронку?', a: 'Іноді так. Це оцінює лікар на огляді.' }
      ]
    },
    {
      id: 'surgery', slug: 'surgery', cat: 'Хірургія', enabled: true,
      title: 'Хірургічна стоматологія', short: 'Консультація хірурга',
      priceFrom: 3200, priceNote: 'Демо-ціна від 3 200 ₴',
      duration: 60, doctors: ['oleh'],
      lead: 'Хірургічний напрям для ситуацій, які потребують окремого клінічного рішення.',
      summary: 'Хірургічні втручання призначає лікар після огляду та діагностики. Демо-сторінка не описує конкретних показань і не замінює консультацію. Вона допомагає записатися та підготувати питання.',
      bullets: ['Консультація хірурга', 'Діагностика за показаннями', 'Обговорення підготовки', 'План супроводу'],
      process: [
        { t: 'Консультація', d: 'Оцінка запиту та протипоказань.' },
        { t: 'Підготовка', d: 'Рекомендації лікаря перед втручанням.' },
        { t: 'Втручання', d: 'Виконується за погодженим планом.' },
        { t: 'Контроль', d: 'Огляд у визначений лікарем час.' }
      ],
      expect: ['Повідомте про ліки та алергії.', 'Уточніть супровід після візиту.', 'Дотримуйтесь інструкцій лікаря.'],
      faq: [
        { q: 'Чи потрібні аналізи?', a: 'Іноді так. Це визначає лікар.' },
        { q: 'Чи можна керувати болем?', a: 'Знеболення обговорюється індивідуально.' },
        { q: 'Скільки триває відновлення?', a: 'Залежить від втручання. Лікар надасть орієнтири.' }
      ]
    },
    {
      id: 'kids', slug: 'kids', cat: 'Діти', enabled: true,
      title: 'Дитяча стоматологія', short: 'Спокійне знайомство з лікарем',
      priceFrom: 900, priceNote: 'Демо-ціна від 900 ₴',
      duration: 40, doctors: ['marta'],
      lead: 'Перший візит без тиску: знайомство, огляд і звикання до кабінету.',
      summary: 'Дитячий прийом будується навколо комфорту дитини та пояснень для батьків. Демо-сторінка описує загальний формат візиту. Клінічні рішення ухвалює лікар після огляду.',
      bullets: ['Знайомство з лікарем', 'Огляд у комфортному темпі', 'Пояснення батькам', 'Профілактичні поради'],
      process: [
        { t: 'Знайомство', d: 'Лікар спілкується з дитиною та батьками.' },
        { t: 'Огляд', d: 'У темпі, комфортному для дитини.' },
        { t: 'Пояснення', d: 'Батьки отримують зрозумілий зворотний зв\'язок.' },
        { t: 'План', d: 'За потреби — наступні візити.' }
      ],
      expect: ['Візьміть улюблену іграшку дитини.', 'Не обіцяйте «нічого не буде».', 'Повідомте про попередній досвід.'],
      faq: [
        { q: 'З якого віку приймаєте?', a: 'Демо-клініка приймає дітей за попереднім записом.' },
        { q: 'Чи можна бути поруч?', a: 'Так, формат супроводу обговорюється з лікарем.' },
        { q: 'Що робити, якщо дитина боїться?', a: 'Повідомте адміністратора заздалегідь — візит спланують спокійніше.' }
      ]
    },
    {
      id: 'emergency', slug: 'emergency', cat: 'Невідкладна допомога', enabled: true,
      title: 'Невідкладний прийом', short: 'Коли потрібен терміновий візит',
      priceFrom: 1200, priceNote: 'Демо-ціна від 1 200 ₴',
      duration: 30, doctors: ['iryna', 'oleh'],
      lead: 'Окремий канал для термінових звернень. Демо-форма не є медичною допомогою.',
      summary: 'Якщо біль або стан потребує негайної уваги, телефонуйте до клініки. Демо-сайт не надає медичних порад і не гарантує прийом у конкретний час. Заявка через сайт лише передає запит адміністратору.',
      bullets: ['Окремий телефонний канал', 'Пріоритетна обробка заявки', 'Оцінка ситуації лікарем', 'Подальший план на прийомі'],
      process: [
        { t: 'Дзвінок', d: 'Зателефонуйте, якщо ситуація термінова.' },
        { t: 'Уточнення', d: 'Адміністратор уточнює запит і вільні слоти.' },
        { t: 'Візит', d: 'Лікар оцінює стан на прийомі.' },
        { t: 'План', d: 'Подальші дії пояснює лікар.' }
      ],
      expect: ['Телефонуйте, не чекайте відповіді на форму.', 'Повідомте про сильний біль або травму.', 'Не приймайте ліки без поради фахівця.'],
      faq: [
        { q: 'Сайт дає медичні поради?', a: 'Ні. У терміновій ситуації телефонуйте до клініки або екстрених служб.' },
        { q: 'Чи приймаєте вночі?', a: 'Графік у демо-версії умовний.' },
        { q: 'Чи можна записатися на завтра?', a: 'Адміністратор запропонує найближчі вільні слоти.' }
      ]
    }
  ];

  /* ---------- doctors ---------- */
  var DOCTORS = [
    {
      id: 'iryna', slug: 'iryna-koval', name: 'Ірина Коваль', initials: 'ІК',
      role: 'Стоматологиня-терапевтка', spec: 'Терапія · ендодонтія · гігієна',
      services: ['general', 'hygiene', 'therapy', 'endo', 'emergency'],
      experience: 'Демо-досвід: 9 років (умовне значення)',
      education: 'Демо-освіта: стоматологічний факультет, 2017 (вигадані дані)',
      bio: 'Працює з пацієнтами, які хочуть зрозуміти план лікування та відчувати контроль над рішеннями. Пояснює етапи простою мовою.',
      focus: ['Планування терапії', 'Комфорт під час лікування', 'Профілактика'],
      tags: ['Дорослі', 'Терапія', 'Ендодонтія']
    },
    {
      id: 'oleh', slug: 'oleh-marchenko', name: 'Олег Марченко', initials: 'ОМ',
      role: 'Імплантолог, хірург', spec: 'Імплантація · хірургія',
      services: ['implants', 'surgery', 'emergency'],
      experience: 'Демо-досвід: 12 років (умовне значення)',
      education: 'Демо-освіта: хірургічна стоматологія, 2014 (вигадані дані)',
      bio: 'Фокусується на діагностиці та поясненні альтернатив. Вважає, що пацієнт має розуміти ризики й етапи до початку лікування.',
      focus: ['Імплантація', 'Хірургічні консультації', 'Супровід'],
      tags: ['Дорослі', 'Імпланти', 'Хірургія']
    },
    {
      id: 'sofia', slug: 'sofia-bondar', name: 'Софія Бондар', initials: 'СБ',
      role: 'Ортодонтка', spec: 'Ортодонтія · прикус',
      services: ['ortho', 'general'],
      experience: 'Демо-досвід: 7 років (умовне значення)',
      education: 'Демо-освіта: ортодонтія, 2019 (вигадані дані)',
      bio: 'Починає з консультації та діагностики, пояснює варіанти без обіцянок швидкого результату. Працює з підлітками та дорослими.',
      focus: ['Консультації', 'Планування', 'Контрольні візити'],
      tags: ['Підлітки', 'Дорослі', 'Прикус']
    },
    {
      id: 'dmytro', slug: 'dmytro-savchenko', name: 'Дмитро Савченко', initials: 'ДС',
      role: 'Стоматолог-ортопед', spec: 'Протезування · відновлення',
      services: ['prosthetics', 'general'],
      experience: 'Демо-досвід: 11 років (умовне значення)',
      education: 'Демо-освіта: ортопедична стоматологія, 2015 (вигадані дані)',
      bio: 'Обговорює конструкції, матеріали та догляд. Наголошує на довгостроковому плануванні, а не на швидкому рішенні.',
      focus: ['Коронки та вкладки', 'Планування', 'Догляд'],
      tags: ['Дорослі', 'Протезування']
    },
    {
      id: 'marta', slug: 'marta-hrytsenko', name: 'Марта Гриценко', initials: 'МГ',
      role: 'Дитяча стоматологиня', spec: 'Дитячий прийом · гігієна',
      services: ['kids', 'hygiene', 'general'],
      experience: 'Демо-досвід: 6 років (умовне значення)',
      education: 'Демо-освіта: дитяча стоматологія, 2020 (вигадані дані)',
      bio: 'Створює спокійний перший візит: знайомство, пояснення та комфортний темп. Батьки отримують зрозумілий зворотний зв\'язок.',
      focus: ['Перший візит', 'Профілактика', 'Комфорт'],
      tags: ['Діти', 'Гігієна']
    }
  ];

  /* ---------- acquisition channels ---------- */
  var SOURCES = [
    { id: 'google_search', label: 'Google Search Ads', short: 'Google Ads', color: '#19DFA0', spend: 24500, visitors: 2180, type: 'paid' },
    { id: 'google_maps', label: 'Google Maps / Business Profile', short: 'Maps', color: '#7AFFCB', spend: 0, visitors: 1640, type: 'local' },
    { id: 'local_seo', label: 'Локальне SEO', short: 'SEO', color: '#087A58', spend: 8200, visitors: 2960, type: 'organic' },
    { id: 'meta', label: 'Meta Ads (Instagram / Facebook)', short: 'Meta Ads', color: '#38C79A', spend: 18600, visitors: 4820, type: 'paid' },
    { id: 'organic_social', label: 'Органічні соцмережі', short: 'Social', color: '#9BEBCB', spend: 6400, visitors: 2240, type: 'organic' },
    { id: 'youtube', label: 'YouTube / відео', short: 'Video', color: '#2E9C7C', spend: 9100, visitors: 1380, type: 'paid' },
    { id: 'retargeting', label: 'Ретаргетинг', short: 'Retargeting', color: '#62D6B0', spend: 4800, visitors: 960, type: 'paid' },
    { id: 'referral', label: 'Рекомендації пацієнтів', short: 'Referral', color: '#C9F7E4', spend: 1200, visitors: 420, type: 'earned' },
    { id: 'direct', label: 'Прямі звернення', short: 'Direct', color: '#5B8F7C', spend: 0, visitors: 780, type: 'direct' },
    { id: 'recall', label: 'Recall / повторні візити', short: 'Recall', color: '#A8D8C4', spend: 900, visitors: 610, type: 'retention' }
  ];

  var ADMINS = [
    { id: 'olena', name: 'Олена Ткач', role: 'Адміністраторка', initials: 'ОТ' },
    { id: 'natalia', name: 'Наталія Лисенко', role: 'Адміністраторка', initials: 'НЛ' },
    { id: 'andrii', name: 'Андрій Мельник', role: 'Координатор пацієнтів', initials: 'АМ' }
  ];

  var STAGES = [
    { id: 'new', label: 'Нове звернення', short: 'Нове', tone: 'info' },
    { id: 'attempt', label: 'Спроба контакту', short: 'Спроба', tone: 'info' },
    { id: 'contacted', label: 'Контакт встановлено', short: 'Контакт', tone: 'info' },
    { id: 'booked', label: 'Консультацію заброньовано', short: 'Бронь', tone: 'warn' },
    { id: 'confirmed', label: 'Візит підтверджено', short: 'Підтверджено', tone: 'ok' },
    { id: 'visited', label: 'Перший візит завершено', short: 'Візит', tone: 'ok' },
    { id: 'plan', label: 'План лікування презентовано', short: 'План', tone: 'ok' },
    { id: 'decision', label: 'Очікує рішення пацієнта', short: 'Рішення', tone: 'warn' },
    { id: 'next', label: 'Наступний візит призначено', short: 'Наступний', tone: 'ok' },
    { id: 'done', label: 'Лікування завершено', short: 'Завершено', tone: 'ok' },
    { id: 'recall', label: 'Recall / повторний візит', short: 'Recall', tone: 'ok' },
    { id: 'lost', label: 'Втрачено / неактивний', short: 'Втрачено', tone: 'bad' }
  ];

  var STAGE_MAP = {};
  STAGES.forEach(function (s, i) { s.order = i; STAGE_MAP[s.id] = s; });

  var LOST_REASONS = ['Обрав іншу клініку', 'Не відповів після 3 спроб', 'Питання ціни', 'Відклав лікування', 'Непідходящий напрям', 'Дублікат заявки'];

  /* ---------- content calendar (30 days, editable demo) ---------- */
  var CONTENT_PILLARS = [
    { id: 'doctor', label: 'Знайомство з лікарем' },
    { id: 'edu', label: 'Освітній контент' },
    { id: 'clinic', label: 'Простір клініки' },
    { id: 'tech', label: 'Технології' },
    { id: 'procedure', label: 'Пояснення процедур' },
    { id: 'experience', label: 'Досвід пацієнта (з дозволом)' },
    { id: 'faq', label: 'Часті питання' },
    { id: 'behind', label: 'За лаштунками' }
  ];

  var CONTENT_TEMPLATES = [
    { pillar: 'doctor', format: 'Reels 30с', title: '«Чому я пояснюю план лікування двічі»', cta: 'Записатися на консультацію', channels: ['instagram', 'tiktok', 'shorts'] },
    { pillar: 'edu', format: 'Карусель', title: '5 питань, які варто поставити стоматологу', cta: 'Зберегти чекліст', channels: ['instagram', 'facebook'] },
    { pillar: 'clinic', format: 'Фото + текст', title: 'Ранок у клініці: як готується кабінет', cta: 'Подивитися простори', channels: ['instagram'] },
    { pillar: 'tech', format: 'Reels 45с', title: 'Як працює цифровий знімок — без складних слів', cta: 'Поставити питання', channels: ['instagram', 'shorts'] },
    { pillar: 'procedure', format: 'Карусель', title: 'Професійна гігієна: що відбувається на візиті', cta: 'Обрати час', channels: ['instagram', 'facebook'] },
    { pillar: 'experience', format: 'Відео 60с', title: 'Пацієнтка розповідає про перший візит (дозвіл підтверджено)', cta: 'Записатися', channels: ['instagram', 'youtube'] },
    { pillar: 'faq', format: 'Сторіс Q&A', title: 'Чи боляче ставити імплант?', cta: 'Поставити своє питання', channels: ['instagram'] },
    { pillar: 'behind', format: 'Reels 20с', title: 'Стерилізація: коротко про процес', cta: 'Дізнатися більше', channels: ['instagram', 'tiktok'] },
    { pillar: 'edu', format: 'YouTube 6–8 хв', title: 'Як обрати стоматолога: 7 критеріїв', cta: 'Перейти на сайт', channels: ['youtube'] },
    { pillar: 'doctor', format: 'Фото + цитата', title: 'Принципи дитячого прийому', cta: 'Записати дитину', channels: ['instagram', 'facebook'] }
  ];

  function buildCalendar() {
    var out = [];
    for (var i = 0; i < 30; i++) {
      var t = CONTENT_TEMPLATES[i % CONTENT_TEMPLATES.length];
      out.push({
        day: i + 1,
        pillar: t.pillar,
        format: t.format,
        title: t.title,
        cta: t.cta,
        channels: t.channels,
        done: i < 9
      });
    }
    return out;
  }

  /* ---------- campaign structures ---------- */
  var CAMPAIGNS = {
    google: [
      {
        id: 'g-impl', name: 'Імплантація — пошук', budget: 9000, status: 'active', landing: '/services/implants/',
        groups: [
          { name: 'Імпланти — загальні', keywords: ['імплантація зубів київ', 'скільки коштує імплант', 'імплант зуба ціна'], neg: ['безкоштовно', 'вакансії', 'фото'] },
          { name: 'Відсутній зуб', keywords: ['відновити відсутній зуб', 'імплант замість зуба'], neg: ['народні засоби'] }
        ],
        utm: 'utm_source=google&utm_medium=cpc&utm_campaign=implants_search'
      },
      {
        id: 'g-emerg', name: 'Невідкладна допомога', budget: 6200, status: 'active', landing: '/services/emergency/',
        groups: [{ name: 'Терміново', keywords: ['стоматолог терміново', 'болить зуб куди звернутися', 'невідкладна стоматологія'], neg: ['безкоштовно', 'ніч'] }],
        utm: 'utm_source=google&utm_medium=cpc&utm_campaign=emergency_search'
      },
      {
        id: 'g-hyg', name: 'Гігієна — пошук', budget: 4800, status: 'active', landing: '/services/hygiene/',
        groups: [{ name: 'Гігієна', keywords: ['професійна гігієна зубів', 'чистка зубів київ', 'ультразвукова чистка'], neg: ['відгуки', 'форум'] }],
        utm: 'utm_source=google&utm_medium=cpc&utm_campaign=hygiene_search'
      },
      {
        id: 'g-ortho', name: 'Ортодонтія — пошук', budget: 3600, status: 'paused', landing: '/services/orthodontics/',
        groups: [{ name: 'Брекети', keywords: ['брекети київ', 'консультація ортодонта', 'вирівнювання зубів'], neg: ['ціна під ключ'] }],
        utm: 'utm_source=google&utm_medium=cpc&utm_campaign=ortho_search'
      },
      {
        id: 'g-brand', name: 'Бренд + клініка', budget: 2400, status: 'active', landing: '/',
        groups: [{ name: 'Бренд', keywords: ['smila dental', 'стоматологія печерськ'], neg: ['скарги'] }],
        utm: 'utm_source=google&utm_medium=cpc&utm_campaign=brand'
      }
    ],
    meta: [
      { id: 'm-brand', name: 'Обізнаність: клініка', objective: 'awareness', budget: 3200, audience: '18–55, Київ + 15 км, інтереси: здоров\'я, сім\'я', creative: 'Відео-тур клінікою 15с', landing: '/' },
      { id: 'm-edu', name: 'Освітнє відео', objective: 'video views', budget: 5200, audience: '25–55, широкі інтереси, без медичних сегментів', creative: 'Пояснення гігієни 30с', landing: '/services/hygiene/' },
      { id: 'm-service', name: 'Імплантація: консультація', objective: 'traffic', budget: 6400, audience: '30–60, Київ, без health-based аудиторій', creative: 'Карусель: 3 кроки консультації', landing: '/services/implants/' },
      { id: 'm-doctor', name: 'Знайомство з лікарями', objective: 'engagement', budget: 2600, audience: '25–55, Київ, інтерес до сімейного здоров\'я', creative: 'Reels: день із лікарем', landing: '/team/' }
    ],
    video: [
      { id: 'v-tour', title: 'Тур клінікою', length: '60–90 с', platform: 'YouTube + сайт', landing: '/clinic/' },
      { id: 'v-doctor', title: 'Знайомство з лікаркою', length: '45 с', platform: 'YouTube / Shorts', landing: '/team/iryna-koval/' },
      { id: 'v-hyg', title: 'Гігієна: що відбувається на візиті', length: '3–4 хв', platform: 'YouTube', landing: '/services/hygiene/' },
      { id: 'v-implant', title: 'Консультація щодо імпланта', length: '4–5 хв', platform: 'YouTube', landing: '/services/implants/' },
      { id: 'v-kids', title: 'Перший візит дитини', length: '50 с', platform: 'Shorts / Reels', landing: '/services/kids/' },
      { id: 'v-faq', title: '5 питань адміністратору', length: '2 хв', platform: 'Shorts', landing: '/booking/' }
    ]
  };

  var MAPS_CHECKLIST = [
    { label: 'Назва клініки без ключових слів', state: 'done' },
    { label: 'Категорія: Стоматологічна клініка', state: 'done' },
    { label: 'Адреса-заглушка та зона обслуговування', state: 'done' },
    { label: 'Графік роботи, включно зі святами', state: 'warn' },
    { label: 'Телефон і кнопка «Записатися»', state: 'done' },
    { label: 'Послуги з описами', state: 'warn' },
    { label: 'Фотографії інтер\'єру та команди', state: 'todo' },
    { label: 'Відповіді на відгуки за регламентом', state: 'warn' },
    { label: 'UTM для переходів із профілю', state: 'done' },
    { label: 'Щомісячний аудит дублікатів', state: 'todo' }
  ];

  var RETARGETING_TIERS = [
    { tier: 'Дозволено', title: 'Загальна обізнаність', desc: 'Відвідувачі головної та освітніх сторінок без медичних параметрів.', state: 'ok' },
    { tier: 'Дозволено', title: 'Контентні аудиторії', desc: 'Переглянули відео або відкрили сторінку послуги без подій про здоров\'я.', state: 'ok' },
    { tier: 'Обмежено', title: 'Залученість на сайті', desc: 'Потрібна перевірка згоди та налаштувань тегу. Не включати дані форм.', state: 'warn' },
    { tier: 'Заборонено', title: 'Медичні стани / пацієнтські списки', desc: 'Не використовувати. Жодних списків пацієнтів, діагнозів чи лікування в рекламі.', state: 'bad' }
  ];

  /* ---------- automations ---------- */
  var AUTOMATIONS = [
    { id: 'a1', no: '01', name: 'Нове звернення', trigger: 'Нова заявка з сайту', channel: 'CRM + email адміністратору',
      actions: ['Створити лід', 'Записати UTM і джерело', 'Призначити адміністратора', 'Створити задачу першого контакту', 'Показати сповіщення', 'Зафіксувати час відповіді'],
      enabled: true, sla: 15 },
    { id: 'a2', no: '02', name: 'Пропущений контакт', trigger: 'Немає контакту протягом SLA', channel: 'CRM + Telegram (симуляція)',
      actions: ['Створити повторну задачу', 'Позначити «потребує уваги»', 'Сповістити адміністратора', 'Зафіксувати ескалацію'],
      enabled: true, sla: 15 },
    { id: 'a3', no: '03', name: 'Підтвердження візиту', trigger: 'Створено запис на прийом', channel: 'Email / SMS (симуляція)',
      actions: ['Показати текст підтвердження', 'Запланувати нагадування', 'Оновити статус підтвердження'],
      enabled: true, sla: 0 },
    { id: 'a4', no: '04', name: 'Нагадування про візит', trigger: 'До візиту 24 години', channel: 'SMS / WhatsApp (симуляція)',
      actions: ['Надіслати нагадування (симуляція)', 'Запропонувати підтвердити', 'Запропонувати перенесення', 'Оновити статус'],
      enabled: true, sla: 0 },
    { id: 'a5', no: '05', name: 'Відновлення після неявки', trigger: 'Позначено неявку', channel: 'SMS + дзвінок (симуляція)',
      actions: ['Змінити статус візиту', 'Створити задачу адміністратору', 'Надіслати ввічливе повідомлення', 'Відстежити новий запис'],
      enabled: true, sla: 0 },
    { id: 'a6', no: '06', name: 'Супровід після консультації', trigger: 'Консультацію завершено', channel: 'CRM',
      actions: ['Створити задачу супроводу', 'Встановити дедлайн', 'Відстежити спроби контакту', 'Зафіксувати, чи призначено візит'],
      enabled: true, sla: 0 },
    { id: 'a7', no: '07', name: 'Супровід плану лікування', trigger: 'План презентовано, візит не призначено', channel: 'Email / телефон (симуляція)',
      actions: ['Створити задачу', 'Надіслати нейтральне нагадування', 'Зафіксувати наступну дію', 'Не генерувати клінічних порад'],
      enabled: true, sla: 0 },
    { id: 'a8', no: '08', name: 'Комунікація після візиту', trigger: 'Візит позначено завершеним', channel: 'Email (симуляція)',
      actions: ['Надіслати подяку', 'Запропонувати необов\'язковий відгук', 'Створити задачу за потреби'],
      enabled: true, sla: 0 },
    { id: 'a9', no: '09', name: 'Профілактичний recall', trigger: 'Настав налаштований інтервал', channel: 'SMS / email (симуляція)',
      actions: ['Додати до черги recall', 'Створити задачу нагадування', 'Відстежити відповідь', 'Зафіксувати повторний візит'],
      enabled: false, sla: 0 },
    { id: 'a10', no: '10', name: 'Реактивація неактивних', trigger: 'Немає активності 12+ місяців', channel: 'Email (симуляція)',
      actions: ['Перевірити згоду та канали', 'Створити задачу реактивації', 'Надіслати нейтральне повідомлення', 'Відстежити результат'],
      enabled: false, sla: 0 }
  ];

  /* ---------- deterministic PRNG ---------- */
  function mulberry(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isoStamp(d) { return isoDate(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  var FIRST = ['Аліна', 'Марія', 'Олег', 'Ігор', 'Катерина', 'Андрій', 'Юлія', 'Сергій', 'Вікторія', 'Дмитро', 'Софія', 'Максим', 'Олена', 'Павло', 'Наталія', 'Роман', 'Анна', 'Богдан', 'Ірина', 'Тарас', 'Леся', 'Михайло', 'Дарина', 'Артем', 'Валерія', 'Євген', 'Христина', 'Назар', 'Поліна', 'Василь'];
  var LAST = ['Мельник', 'Шевченко', 'Бондаренко', 'Коваленко', 'Ткаченко', 'Кравчук', 'Олійник', 'Марченко', 'Лисенко', 'Савченко', 'Петренко', 'Гриценко', 'Романенко', 'Мороз', 'Левченко', 'Козак', 'Демченко', 'Гаврилюк', 'Захарченко', 'Кузьменко'];

  var BOOK_TIMES = ['09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '14:00', '14:40', '15:20', '16:00', '16:40', '17:20', '18:00', '18:40'];

  function seedData() {
    var rnd = mulberry(20261112);
    var today = startOfDay(new Date());
    var leads = [];
    var appointments = [];
    var tasks = [];
    var history = [];

    var stagePlan = [
      'new', 'new', 'new', 'attempt', 'attempt', 'contacted', 'contacted', 'contacted',
      'booked', 'booked', 'booked', 'confirmed', 'confirmed', 'confirmed',
      'visited', 'visited', 'visited', 'plan', 'plan', 'decision', 'decision',
      'next', 'next', 'next', 'done', 'done', 'recall', 'recall', 'lost', 'lost'
    ];

    var total = 44;
    for (var i = 0; i < total; i++) {
      var age = Math.floor(i * 1.28);
      var created = addDays(today, -age);
      created.setHours(8 + Math.floor(rnd() * 11), Math.floor(rnd() * 12) * 5, 0, 0);
      if (age === 0) created = new Date(Math.min(created.getTime(), Date.now()));

      var src = SOURCES[Math.floor(rnd() * SOURCES.length)];
      var service = SERVICES[Math.floor(rnd() * SERVICES.length)];
      var doctor = DOCTORS[Math.floor(rnd() * DOCTORS.length)];
      var stage = stagePlan[i % stagePlan.length];
      if (age > 24 && (stage === 'new' || stage === 'attempt' || stage === 'booked')) stage = 'lost';
      var admin = ADMINS[Math.floor(rnd() * ADMINS.length)];
      var first = FIRST[Math.floor(rnd() * FIRST.length)];
      var last = LAST[Math.floor(rnd() * LAST.length)];
      var id = 'L-' + (1040 + total - i);
      var phone = '+380 (44) 000-00-' + pad(10 + (i % 80));
      var consentAt = new Date(created.getTime() + 60000);

      var hist = [];
      var target = STAGE_MAP[stage].order;
      var cursor = created;
      for (var st = 0; st <= target; st++) {
        if (st === 0) { hist.push({ stage: 'new', at: isoStamp(created), by: 'Система' }); continue; }
        if (st === 11) continue;
        cursor = new Date(cursor.getTime() + (1 + rnd() * 2.2) * 86400000);
        if (cursor > new Date()) cursor = new Date(Date.now() - 3600000);
        hist.push({ stage: STAGES[st].id, at: isoStamp(cursor), by: admin.name });
      }
      if (stage === 'lost') {
        hist.push({ stage: 'lost', at: isoStamp(new Date(Math.min(new Date().getTime(), cursor.getTime() + 3 * 86400000))), by: admin.name });
      }

      var lastContact = null;
      if (target >= 2) lastContact = hist[Math.min(hist.length - 1, 2)].at;

      var lead = {
        id: id,
        name: first + ' ' + last,
        phone: phone,
        email: '',
        city: rnd() > .25 ? 'Київ' : 'Київська область',
        createdAt: isoStamp(created),
        source: src.id,
        campaign: src.id === 'google_search' ? CAMPAIGNS.google[Math.floor(rnd() * CAMPAIGNS.google.length)].name :
          src.id === 'meta' ? CAMPAIGNS.meta[Math.floor(rnd() * CAMPAIGNS.meta.length)].name :
            src.id === 'local_seo' ? 'Органічна сторінка послуги' :
              src.id === 'referral' ? 'Рекомендація пацієнта' : src.label,
        adgroup: src.id === 'google_search' ? 'Пошукова група' : src.id === 'meta' ? 'Широка аудиторія' : '—',
        creative: src.id === 'meta' ? 'Reels 30с' : src.id === 'youtube' ? 'Відео 3–4 хв' : '—',
        utm: {
          source: src.id === 'google_search' ? 'google' : src.id === 'meta' ? 'meta' : src.id === 'local_seo' ? 'organic' : src.id,
          medium: src.type === 'paid' ? 'cpc' : src.type === 'local' ? 'local' : src.type === 'organic' ? 'organic' : 'referral',
          campaign: src.id + '_demo'
        },
        landing: '/services/' + service.slug + '/',
        serviceId: service.id,
        doctorId: doctor.id,
        adminId: admin.id,
        stage: stage,
        stageSince: hist[hist.length - 1].at,
        lastContact: lastContact,
        nextAction: stage === 'new' ? 'Зателефонувати' : stage === 'attempt' ? 'Повторний дзвінок' : stage === 'booked' ? 'Підтвердити візит' : stage === 'decision' ? 'Уточнити рішення' : stage === 'recall' ? 'Recall-дзвінок' : '—',
        appointmentId: null,
        lostReason: stage === 'lost' ? LOST_REASONS[Math.floor(rnd() * LOST_REASONS.length)] : '',
        consent: { appointment: true, marketing: rnd() > .35, at: isoStamp(consentAt) },
        notes: [],
        history: hist
      };

      if (rnd() > .55) {
        lead.notes.push({ at: isoStamp(new Date(created.getTime() + 3600000)), by: admin.name, text: 'Заявка з сайту. Пацієнт просить зв\'язатися у другій половині дня.' });
      }
      if (stage === 'decision' || stage === 'plan') {
        lead.notes.push({ at: isoStamp(new Date(created.getTime() + 4 * 86400000)), by: admin.name, text: 'План презентовано лікарем. Адміністратор уточнює зручний час наступного візиту.' });
      }
      if (stage === 'lost') {
        lead.notes.push({ at: lead.stageSince, by: admin.name, text: 'Причина: ' + lead.lostReason + '. Запис закрито без тиску на пацієнта.' });
      }

      leads.push(lead);

      /* appointment linkage */
      var appt = null;
      if (['booked', 'confirmed', 'visited', 'plan', 'decision', 'next', 'done', 'recall'].indexOf(stage) >= 0) {
        var status = 'request';
        var dOff = 2;
        if (stage === 'booked') { status = 'request'; dOff = 1 + Math.floor(rnd() * 5); }
        else if (stage === 'confirmed') { status = 'confirmed'; dOff = 1 + Math.floor(rnd() * 4); }
        else if (stage === 'visited' || stage === 'plan' || stage === 'decision') { status = 'completed'; dOff = -Math.max(1, age - 1); }
        else if (stage === 'next') { status = 'confirmed'; dOff = 1 + Math.floor(rnd() * 6); }
        else if (stage === 'done') { status = 'completed'; dOff = -Math.max(2, age - 2); }
        else if (stage === 'recall') { status = 'completed'; dOff = -Math.max(3, age - 3); }
        var ad = addDays(today, dOff);
        appt = {
          id: 'A-' + (2200 + appointments.length),
          leadId: id,
          serviceId: service.id,
          doctorId: doctor.id,
          date: isoDate(ad),
          time: BOOK_TIMES[Math.floor(rnd() * BOOK_TIMES.length)],
          status: status,
          createdAt: isoStamp(created),
          note: status === 'request' ? 'Заявка з сайту, очікує підтвердження' : ''
        };
        appointments.push(appt);
        lead.appointmentId = appt.id;
      }

      /* second visit for retention stages */
      if (stage === 'next' || stage === 'done' || stage === 'recall') {
        var ad2 = addDays(today, stage === 'next' ? 3 + Math.floor(rnd() * 8) : -Math.floor(rnd() * 20) - 2);
        var appt2 = {
          id: 'A-' + (2200 + appointments.length),
          leadId: id,
          serviceId: service.id,
          doctorId: doctor.id,
          date: isoDate(ad2),
          time: BOOK_TIMES[Math.floor(rnd() * BOOK_TIMES.length)],
          status: stage === 'next' ? 'confirmed' : 'completed',
          createdAt: isoStamp(created),
          note: 'Повторний візит'
        };
        appointments.push(appt2);
      }

      /* tasks for open stages */
      if (['new', 'attempt', 'contacted', 'booked', 'decision', 'recall', 'plan'].indexOf(stage) >= 0) {
        var due = addDays(today, stage === 'new' ? 0 : stage === 'recall' ? 1 : Math.floor(rnd() * 3));
        tasks.push({
          id: 'T-' + (3100 + tasks.length),
          leadId: id,
          title: stage === 'new' ? 'Перший контакт із пацієнтом' :
            stage === 'attempt' ? 'Повторна спроба контакту' :
              stage === 'booked' ? 'Підтвердити запис на прийом' :
                stage === 'decision' ? 'Уточнити рішення щодо плану' :
                  stage === 'recall' ? 'Recall: запропонувати плановий візит' : 'Супровід після консультації',
          type: 'call',
          due: isoDate(due),
          owner: admin.id,
          status: rnd() > .8 ? 'done' : 'open'
        });
      }
    }

    /* a couple of appointments for today */
    var todayPick = leads.filter(function (l) { return l.stage === 'confirmed'; }).slice(0, 3);
    todayPick.forEach(function (l, k) {
      var exists = appointments.some(function (a) { return a.leadId === l.id && a.date === isoDate(today); });
      if (!exists) {
        var a = {
          id: 'A-' + (2200 + appointments.length),
          leadId: l.id, serviceId: l.serviceId, doctorId: l.doctorId,
          date: isoDate(today), time: BOOK_TIMES[k + 3], status: 'confirmed', createdAt: isoStamp(today), note: 'Підтверджено адміністратором'
        };
        appointments.push(a);
        l.appointmentId = a.id;
      }
    });

    /* no-show examples */
    leads.filter(function (l) { return l.stage === 'visited'; }).slice(0, 2).forEach(function (l) {
      var a = appointments.find(function (x) { return x.leadId === l.id; });
      if (a) a.status = 'no_show';
    });

    var autoState = AUTOMATIONS.map(function (a) {
      var runs = a.id === 'a9' || a.id === 'a10' ? 6 : 14 + Math.floor(rnd() * 20);
      return {
        id: a.id, enabled: a.enabled, runs: runs,
        lastRun: isoStamp(new Date(Date.now() - Math.floor(rnd() * 5) * 3600000 - 600000)),
        nextRun: isoStamp(new Date(Date.now() + Math.floor(2 + rnd() * 22) * 3600000)),
        status: a.id === 'a2' ? 'error' : a.enabled ? 'active' : 'paused',
        lastError: a.id === 'a2' ? 'Симуляційна помилка каналу: отримувач не визначений' : ''
      };
    });

    /* automation history */
    var logTitles = [
      'Створено лід і задачу першого контакту', 'Нагадування заплановано', 'Надіслано симуляційне нагадування',
      'Створено задачу супроводу', 'Зафіксовано неявку, створено задачу', 'Додано до черги recall',
      'Перевірено згоду на комунікацію', 'Оновлено статус підтвердження', 'Помилка симуляції каналу'
    ];
    for (var h = 0; h < 26; h++) {
      var aDef = AUTOMATIONS[Math.floor(rnd() * AUTOMATIONS.length)];
      var leadRef = leads[Math.floor(rnd() * leads.length)];
      history.push({
        id: 'R-' + (4100 + h),
        automationId: aDef.id,
        at: isoStamp(new Date(Date.now() - Math.floor(rnd() * 14 * 24) * 3600000)),
        leadId: leadRef.id,
        text: logTitles[Math.floor(rnd() * logTitles.length)],
        ok: rnd() > .12
      });
    }
    history.sort(function (a, b) { return a.at < b.at ? 1 : -1; });

    var state = {
      v: 1,
      createdAt: new Date().toISOString(),
      leads: leads,
      appointments: appointments,
      tasks: tasks,
      automationState: autoState,
      automationHistory: history,
      contentCalendar: buildCalendar(),
      recallSettings: { intervalMonths: 6, enabled: true, channel: 'email', consentRequired: true },
      retention: { years: 3, anonymizeAfter: 24 },
      logs: [{ at: isoStamp(new Date()), text: 'Демо-середовище ініціалізовано з умовними даними.' }]
    };

    return state;
  }

  /* ---------- storage ---------- */
  var listeners = [];
  var memory = null;

  function read() {
    if (memory) return memory;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1 && parsed.leads) { memory = parsed; return memory; }
      }
    } catch (e) {}
    memory = seedData();
    write(memory);
    return memory;
  }

  function write(state) {
    memory = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('kd:change', { detail: state })); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }

  function reset() {
    memory = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
    var s = read();
    try { window.dispatchEvent(new CustomEvent('kd:reset')); } catch (e) {}
    return s;
  }

  function update(mutator) {
    var s = read();
    mutator(s);
    write(s);
    return s;
  }

  function nextId(prefix, arr) {
    var max = 0;
    arr.forEach(function (x) {
      var n = parseInt(String(x.id).replace(/\D+/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return prefix + (max + 1);
  }

  function nowStamp() { return isoStamp(new Date()); }

  function logEvent(s, text) {
    s.logs.unshift({ at: nowStamp(), text: text });
    if (s.logs.length > 80) s.logs.length = 80;
  }

  /* ---------- public actions ---------- */
  var api = {
    KEY: KEY,
    CLINIC: CLINIC,
    SERVICES: SERVICES,
    DOCTORS: DOCTORS,
    SOURCES: SOURCES,
    ADMINS: ADMINS,
    STAGES: STAGES,
    STAGE_MAP: STAGE_MAP,
    LOST_REASONS: LOST_REASONS,
    AUTOMATIONS: AUTOMATIONS,
    CAMPAIGNS: CAMPAIGNS,
    MAPS_CHECKLIST: MAPS_CHECKLIST,
    RETARGETING_TIERS: RETARGETING_TIERS,
    CONTENT_PILLARS: CONTENT_PILLARS,
    CONTENT_TEMPLATES: CONTENT_TEMPLATES,
    isoDate: isoDate,
    isoStamp: isoStamp,
    addDays: addDays,
    pad: pad,
    startOfDay: startOfDay,
    serviceById: function (id) { return SERVICES.filter(function (s) { return s.id === id; })[0] || null; },
    doctorById: function (id) { return DOCTORS.filter(function (d) { return d.id === id; })[0] || null; },
    sourceById: function (id) { return SOURCES.filter(function (s) { return s.id === id; })[0] || null; },
    adminById: function (id) { return ADMINS.filter(function (a) { return a.id === id; })[0] || null; },
    read: read,
    write: write,
    reset: reset,
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },

    addLead: function (payload) {
      var s = read();
      var id = nextId('L-', s.leads);
      var createdAt = payload.createdAt || nowStamp();
      var lead = {
        id: id,
        name: payload.name || 'Новий пацієнт',
        phone: payload.phone || '',
        email: payload.email || '',
        city: payload.city || 'Київ',
        createdAt: createdAt,
        source: payload.source || 'direct',
        campaign: payload.campaign || 'Демо-заявка',
        adgroup: payload.adgroup || '—',
        creative: payload.creative || '—',
        utm: payload.utm || { source: 'demo', medium: 'demo', campaign: 'demo' },
        landing: payload.landing || '/booking/',
        serviceId: payload.serviceId || 'general',
        doctorId: payload.doctorId || 'iryna',
        adminId: payload.adminId || ADMINS[Math.floor(Math.random() * ADMINS.length)].id,
        stage: payload.stage || 'new',
        stageSince: createdAt,
        lastContact: null,
        nextAction: 'Зателефонувати',
        appointmentId: null,
        lostReason: '',
        consent: payload.consent || { appointment: true, marketing: false, at: createdAt },
        notes: payload.notes || [],
        history: [{ stage: payload.stage || 'new', at: createdAt, by: 'Система' }]
      };
      s.leads.unshift(lead);
      /* first-contact task */
      s.tasks.unshift({
        id: nextId('T-', s.tasks), leadId: id, title: 'Перший контакт із пацієнтом', type: 'call',
        due: isoDate(new Date()), owner: lead.adminId, status: 'open'
      });
      logEvent(s, 'Нове звернення ' + id + ' · ' + lead.name + ' · джерело: ' + lead.source);
      write(s);
      return lead;
    },

    updateLead: function (id, patch) {
      var s = read();
      var lead = s.leads.filter(function (l) { return l.id === id; })[0];
      if (!lead) return null;
      Object.keys(patch).forEach(function (k) { lead[k] = patch[k]; });
      logEvent(s, 'Оновлено лід ' + id + ': ' + Object.keys(patch).join(', '));
      write(s);
      return lead;
    },

    moveStage: function (id, stage, by) {
      var s = read();
      var lead = s.leads.filter(function (l) { return l.id === id; })[0];
      if (!lead || !STAGE_MAP[stage]) return null;
      lead.stage = stage;
      lead.stageSince = nowStamp();
      lead.history.push({ stage: stage, at: lead.stageSince, by: by || 'Адміністратор' });
      if (stage === 'lost') lead.nextAction = '—';
      logEvent(s, 'Стадію ' + id + ' змінено на «' + STAGE_MAP[stage].label + '»');
      write(s);
      return lead;
    },

    addNote: function (id, text, by) {
      var s = read();
      var lead = s.leads.filter(function (l) { return l.id === id; })[0];
      if (!lead || !text) return null;
      lead.notes.unshift({ at: nowStamp(), by: by || 'Адміністратор', text: text });
      lead.lastContact = nowStamp();
      write(s);
      return lead;
    },

    addTask: function (payload) {
      var s = read();
      var task = {
        id: nextId('T-', s.tasks),
        leadId: payload.leadId || null,
        title: payload.title || 'Задача',
        type: payload.type || 'call',
        due: payload.due || isoDate(new Date()),
        owner: payload.owner || ADMINS[0].id,
        status: 'open'
      };
      s.tasks.unshift(task);
      logEvent(s, 'Створено задачу: ' + task.title);
      write(s);
      return task;
    },

    toggleTask: function (id) {
      var s = read();
      s.tasks.forEach(function (t) { if (t.id === id) t.status = t.status === 'open' ? 'done' : 'open'; });
      write(s);
    },

    addAppointment: function (payload) {
      var s = read();
      var appt = {
        id: nextId('A-', s.appointments),
        leadId: payload.leadId,
        serviceId: payload.serviceId || 'general',
        doctorId: payload.doctorId || 'iryna',
        date: payload.date,
        time: payload.time,
        status: payload.status || 'request',
        createdAt: nowStamp(),
        note: payload.note || ''
      };
      s.appointments.push(appt);
      var lead = s.leads.filter(function (l) { return l.id === appt.leadId; })[0];
      if (lead) {
        lead.appointmentId = appt.id;
        lead.stage = appt.status === 'confirmed' ? 'confirmed' : 'booked';
        lead.stageSince = nowStamp();
        lead.history.push({ stage: lead.stage, at: lead.stageSince, by: 'Адміністратор' });
      }
      logEvent(s, 'Створено запис ' + appt.id + ' на ' + appt.date + ' ' + appt.time);
      write(s);
      return appt;
    },

    updateAppointment: function (id, patch) {
      var s = read();
      var appt = s.appointments.filter(function (a) { return a.id === id; })[0];
      if (!appt) return null;
      Object.keys(patch).forEach(function (k) { appt[k] = patch[k]; });
      var lead = s.leads.filter(function (l) { return l.id === appt.leadId; })[0];
      if (lead && patch.status === 'confirmed') {
        lead.stage = 'confirmed';
        lead.stageSince = nowStamp();
        lead.history.push({ stage: 'confirmed', at: lead.stageSince, by: 'Адміністратор' });
      }
      if (lead && patch.status === 'completed') {
        lead.stage = 'visited';
        lead.stageSince = nowStamp();
        lead.history.push({ stage: 'visited', at: lead.stageSince, by: 'Адміністратор' });
      }
      if (lead && patch.status === 'no_show') {
        lead.nextAction = 'Відновлення після неявки';
        s.tasks.unshift({
          id: nextId('T-', s.tasks), leadId: lead.id, title: 'Зв\'язатися після неявки та запропонувати новий час',
          type: 'call', due: isoDate(new Date()), owner: lead.adminId, status: 'open'
        });
      }
      logEvent(s, 'Оновлено запис ' + id + ': ' + Object.keys(patch).join(', '));
      write(s);
      return appt;
    },

    cancelAppointment: function (id) {
      return api.updateAppointment(id, { status: 'cancelled' });
    },

    runAutomation: function (id) {
      var s = read();
      var def = AUTOMATIONS.filter(function (a) { return a.id === id; })[0];
      var st = s.automationState.filter(function (a) { return a.id === id; })[0];
      if (!def || !st) return null;
      if (!st.enabled) return { error: 'Автоматизацію вимкнено' };
      var openLeads = s.leads.filter(function (l) {
        if (id === 'a9') return l.stage === 'done' || l.stage === 'recall';
        if (id === 'a10') return l.stage === 'lost' || l.stage === 'recall';
        if (id === 'a5') return l.stage === 'visited';
        if (id === 'a7') return l.stage === 'plan' || l.stage === 'decision';
        return l.stage === 'new' || l.stage === 'attempt';
      });
      var lead = openLeads[0] || s.leads[0];
      var ok = id !== 'a2' || Math.random() > .35;
      if (id === 'a9') {
        s.recallSettings.enabled = true;
      }
      if (id === 'a6' || id === 'a7' || id === 'a10') {
        s.tasks.unshift({
          id: nextId('T-', s.tasks), leadId: lead.id,
          title: def.actions[0], type: 'followup',
          due: isoDate(addDays(new Date(), 1)), owner: lead.adminId, status: 'open'
        });
      }
      if (id === 'a1' && lead) {
        lead.history.push({ stage: 'attempt', at: nowStamp(), by: 'Система' });
        lead.stage = lead.stage === 'new' ? 'attempt' : lead.stage;
      }
      s.automationHistory.unshift({
        id: nextId('R-', s.automationHistory),
        automationId: id,
        at: nowStamp(),
        leadId: lead ? lead.id : null,
        text: ok ? def.actions[0] + ' · ' + (lead ? lead.id : 'система') : 'Помилка симуляції каналу комунікації',
        ok: ok
      });
      if (s.automationHistory.length > 120) s.automationHistory.length = 120;
      st.runs++;
      st.lastRun = nowStamp();
      st.nextRun = isoStamp(new Date(Date.now() + 6 * 3600000));
      st.status = ok ? (st.enabled ? 'active' : 'paused') : 'error';
      st.lastError = ok ? '' : 'Симуляційна помилка каналу: отримувач не визначений';
      logEvent(s, 'Запуск автоматизації «' + def.name + '»: ' + (ok ? 'успішно' : 'помилка'));
      write(s);
      return { ok: ok, lead: lead ? lead.id : null, text: def.actions[0], def: def };
    },

    toggleAutomation: function (id) {
      var s = read();
      s.automationState.forEach(function (st) {
        if (st.id !== id) return;
        st.enabled = !st.enabled;
        st.status = st.enabled ? 'active' : 'paused';
      });
      write(s);
    },

    logEvent: function (text) { update(function (s) { logEvent(s, text); }); }
  };

  /* ---------- analytics helpers ---------- */
  function inRange(stamp, days) {
    if (!days) return true;
    var t = new Date(stamp).getTime();
    var from = Date.now() - days * 86400000;
    return t >= from;
  }

  api.metrics = function (days) {
    var s = read();
    var leads = s.leads.filter(function (l) { return inRange(l.createdAt, days); });
    var stageOf = function (ids) { return leads.filter(function (l) { return ids.indexOf(l.stage) >= 0; }).length; };
    var appts = s.appointments.filter(function (a) {
      return inRange(a.createdAt, days);
    });
    var visits = appts.filter(function (a) { return a.status === 'completed'; });
    return {
      leads: leads.length,
      newInquiries: leads.length,
      contacted: leads.filter(function (l) { return STAGE_MAP[l.stage].order >= 2; }).length,
      booked: leads.filter(function (l) { return STAGE_MAP[l.stage].order >= 3; }).length,
      confirmed: appts.filter(function (a) { return a.status === 'confirmed'; }).length + leads.filter(function (l) { return l.stage === 'confirmed'; }).length,
      firstVisits: visits.length,
      plans: stageOf(['plan', 'decision', 'next', 'done', 'recall']),
      followups: stageOf(['plan', 'decision']),
      tasksOpen: s.tasks.filter(function (t) { return t.status === 'open'; }).length,
      recallDue: s.leads.filter(function (l) { return l.stage === 'recall' || (l.stage === 'done' && inRange(l.stageSince, 180)); }).length,
      repeat: stageOf(['recall', 'done']),
      lost: stageOf(['lost']),
      showRate: visits.length + appts.filter(function (a) { return a.status === 'no_show'; }).length ? Math.round(visits.length / (visits.length + appts.filter(function (a) { return a.status === 'no_show'; }).length) * 100) : 0,
      spend: SOURCES.reduce(function (sum, src) { return sum + src.spend; }, 0)
    };
  };

  api.bySource = function (days) {
    var s = read();
    var leads = s.leads.filter(function (l) { return inRange(l.createdAt, days); });
    var out = SOURCES.map(function (src) {
      var list = leads.filter(function (l) { return l.source === src.id; });
      var appts = s.appointments.filter(function (a) {
        return list.some(function (l) { return l.id === a.leadId; });
      });
      var confirmed = appts.filter(function (a) { return a.status === 'confirmed' || a.status === 'completed'; }).length;
      var visits = appts.filter(function (a) { return a.status === 'completed'; }).length;
      return {
        id: src.id, label: src.label, short: src.short, color: src.color,
        visitors: Math.round(src.visitors * (days && days < 30 ? days / 30 : 1)),
        inquiries: list.length,
        contacted: list.filter(function (l) { return STAGE_MAP[l.stage].order >= 2; }).length,
        booked: list.filter(function (l) { return STAGE_MAP[l.stage].order >= 3; }).length + confirmed,
        confirmed: confirmed,
        visits: visits,
        repeat: list.filter(function (l) { return l.stage === 'recall'; }).length,
        spend: src.spend,
        cpi: list.length ? Math.round(src.spend / list.length) : 0,
        cpBooking: (list.filter(function (l) { return STAGE_MAP[l.stage].order >= 3; }).length + confirmed) ? Math.round(src.spend / (list.filter(function (l) { return STAGE_MAP[l.stage].order >= 3; }).length + confirmed)) : 0,
        cpVisit: visits ? Math.round(src.spend / visits) : 0
      };
    });
    return out;
  };

  api.funnel = function (days) {
    var m = api.metrics(days);
    var by = api.bySource(days);
    var visitors = by.reduce(function (s, x) { return s + x.visitors; }, 0);
    var inquiries = m.newInquiries;
    var contacted = m.contacted;
    var booked = m.booked;
    var confirmed = m.confirmed;
    var visits = m.firstVisits;
    var repeat = m.repeat;
    var rate = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
    return [
      { id: 'visitors', label: 'Відвідувачі', value: visitors, rate: 100 },
      { id: 'inquiries', label: 'Звернення', value: inquiries, rate: rate(inquiries, visitors) },
      { id: 'contacted', label: 'Контакт встановлено', value: contacted, rate: rate(contacted, inquiries) },
      { id: 'booked', label: 'Заброньовано', value: booked, rate: rate(booked, contacted) },
      { id: 'confirmed', label: 'Підтверджено', value: confirmed, rate: rate(confirmed, booked) },
      { id: 'visits', label: 'Перші візити', value: visits, rate: rate(visits, confirmed) },
      { id: 'repeat', label: 'Повторні візити', value: repeat, rate: rate(repeat, visits) }
    ];
  };

  api.recallQueue = function () {
    var s = read();
    return s.leads.filter(function (l) {
      return l.stage === 'recall' || l.stage === 'done' || l.stage === 'lost';
    }).map(function (l) {
      var last = s.appointments.filter(function (a) { return a.leadId === l.id && a.status === 'completed'; })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
      return {
        lead: l,
        lastVisit: last ? last.date : l.stageSince.slice(0, 10),
        daysSince: last ? Math.round((Date.now() - new Date(last.date).getTime()) / 86400000) : 999,
        consent: !!(l.consent && l.consent.marketing),
        channel: l.consent && l.consent.marketing ? (l.consent.channelPreference || 'email') : '—'
      };
    }).sort(function (a, b) { return b.daysSince - a.daysSince; });
  };

  api.timeInStage = function (lead) {
    var since = new Date(lead.stageSince).getTime();
    var hrs = Math.max(0, Math.round((Date.now() - since) / 3600000));
    return hrs < 48 ? hrs + ' год' : Math.round(hrs / 24) + ' дн';
  };

  api.todayISO = function () { return isoDate(new Date()); };

  global.KD = api;
})(window);
