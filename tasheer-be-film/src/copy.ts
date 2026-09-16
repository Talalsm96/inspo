/* Copy for the film, keyed by the English original.
   The Arabic cut is the same scene, the same beat sheet and the same numbers —
   only the strings and the reading direction change, so the two cuts cannot
   drift apart. Pick the cut at build time:

     python3 scripts/render.py --lang ar BE_Achievements_2025_AR.mp4

   Standards codes (ISO 9001, ISO/IEC 27001, EFQM, KAQA) stay in Latin in the
   Arabic cut, as they do in Tasheer's own Arabic material. */

export type Lang = 'en' | 'ar';

export const LANG: Lang = import.meta.env.VITE_LANG === 'ar' ? 'ar' : 'en';
export const RTL = LANG === 'ar';

const AR: Record<string, string> = {
  /* ------------------------------------------------------------ chrome */
  'Business Excellence': 'التميز المؤسسي',
  '2025 — Achieved': '2025 — منجز',
  '2026 — Plan': '2026 — مخطط',
  'Business Excellence — 2025 achievements, 2026 plan': 'التميز المؤسسي — إنجازات 2025 وخطة 2026',
  'Business Excellence — 2025 delivered, 2026 in motion': 'التميز المؤسسي — 2025 أُنجزت و2026 قيد التنفيذ',

  /* ----------------------------------------------------- station titles */
  'BPM · Documentation': 'إدارة العمليات · التوثيق',
  'BPM · Internal ISO Audit': 'إدارة العمليات · التدقيق الداخلي',
  'BPM · Improvement': 'إدارة العمليات · التحسين',
  'BPM · Service Level Agreements': 'إدارة العمليات · اتفاقيات مستوى الخدمة',
  'Automation of Internal Services': 'أتمتة الخدمات الداخلية',
  'International Standards & Frameworks': 'المعايير والأطر الدولية',
  'Local Content': 'المحتوى المحلي',
  'TIC / PIF Reports': 'تقارير TIC وصندوق الاستثمارات العامة',
  'Training & Awareness': 'التدريب والتوعية',
  'Excellence Framework': 'إطار التميز',

  /* ------------------------------------------------ 1 · documentation */
  'new processes established': 'عملية جديدة تم اعتمادها',
  'processes revamped': 'عملية تم تحديثها',
  're-aligned with Tasheer policies': 'مواءمتها مع سياسات تأشير',
  'Re-align all processes with policies': 'مواءمة جميع العمليات مع السياسات',
  'Revamp all Tasheer processes': 'تحديث جميع عمليات تأشير',
  'Evaluate the need for a BPM tool': 'تقييم الحاجة إلى أداة لإدارة العمليات',
  '41 new processes documented': 'توثيق 41 عملية جديدة',
  '68 processes revamped': 'تحديث 68 عملية',
  '2026: align, revamp, tool': '2026: المواءمة والتحديث وأداة الإدارة',

  /* ----------------------------------------------------- 2 · ISO audit */
  Audits: 'عمليات التدقيق',
  Findings: 'النتائج',
  Completed: 'مكتملة',
  Rescheduled: 'أُعيدت جدولتها',
  'Major NC': 'عدم مطابقة كبرى',
  'Minor NC': 'عدم مطابقة صغرى',
  Observation: 'ملاحظة',
  'scale 0–15': 'المقياس 0–15',
  'scale 0–10': 'المقياس 0–10',
  'On target': 'ضمن المستهدف',
  Complete: 'مكتملة',
  'No response': 'دون استجابة',
  'Failed target, no plan': 'تجاوزت المستهدف دون خطة',
  'findings closed or on target': 'النتائج المغلقة أو ضمن المستهدف',
  'Audit to ISO 9001 and the new standards': 'التدقيق وفق ISO 9001 والمعايير الجديدة',
  'Fully automate the audit process': 'أتمتة عملية التدقيق بالكامل',
  'Quantify the audit score, link to performance': 'قياس نتيجة التدقيق وربطها بالأداء',
  '12 compliance audits completed': 'إنجاز 12 عملية تدقيق امتثال',
  '0 major, 3 minor, 9 observations': 'صفر عدم مطابقة كبرى، و3 صغرى، و9 ملاحظات',
  '80 % of findings closed or on target': 'إغلاق 80% من النتائج أو ضمن المستهدف',
  '2026: automate the audit, score it': '2026: أتمتة التدقيق وقياس نتيجته',

  /* --------------------------------------------------- 3 · improvement */
  'minor process improvements': 'تحسين على العمليات',
  'Purchase request': 'طلب الشراء',
  Payment: 'الدفع',
  'problem-solving support across procure-to-pay': 'دعم حل المشكلات في دورة الشراء حتى الدفع',
  'End-to-end critical processes': 'العمليات الحرجة من البداية إلى النهاية',
  'Optimize and automate the improvement solution': 'تحسين وأتمتة حل التحسين',
  'Facilitate operational challenges': 'تذليل التحديات التشغيلية',
  '48 process improvements delivered': 'تنفيذ 48 تحسيناً على العمليات',
  '2026: end-to-end, PDCA': '2026: العمليات الشاملة ودورة التحسين',

  /* ----------------------------------------------------------- 4 · SLA */
  'SLAs finalised with end users': 'اتفاقية أُنجزت مع المستفيدين',
  'monitored — reminders and escalation': 'اتفاقية مراقبة — تذكيرات وتصعيد',
  'dashboard with D&T': 'لوحة معلومات مع الرقمنة والتقنية',
  'linked to performance': 'مرتبطة بإدارة الأداء',
  'Digital & Technology': 'الرقمنة والتقنية',
  Cybersecurity: 'الأمن السيبراني',
  GRC: 'الحوكمة والمخاطر والالتزام',
  Legal: 'الشؤون القانونية',
  Finance: 'المالية',
  Admin: 'الشؤون الإدارية',
  'Business Operations': 'عمليات الأعمال',
  'Human Capital': 'الموارد البشرية',
  Procurement: 'المشتريات',
  Marketing: 'التسويق',
  Operations: 'التشغيل',
  PMO: 'مكتب إدارة المشاريع',
  'Automate all eligible SLAs': 'أتمتة جميع الاتفاقيات المؤهلة',
  'Set a target scale per department': 'وضع مقياس مستهدف لكل إدارة',
  'Transition to end-to-end SLAs for critical processes': 'التحول إلى اتفاقيات شاملة للعمليات الحرجة',
  '152 SLAs agreed across 13 departments': 'اعتماد 152 اتفاقية مستوى خدمة مع 13 إدارة',
  '115 SLAs monitored, reminders, escalation': 'مراقبة 115 اتفاقية بالتذكيرات والتصعيد',
  '2026: automate, target, end-to-end': '2026: الأتمتة والمستهدفات والشمولية',

  /* ---------------------------------------------------- 5 · automation */
  'new services automated': 'خدمة جديدة مؤتمتة',
  'All SLAs': 'جميع الاتفاقيات',
  'Eligible for automation': 'المؤهلة للأتمتة',
  Automated: 'المؤتمتة',
  'on system': 'على النظام',
  tracking: 'التتبع',
  reminder: 'التذكير',
  escalation: 'التصعيد',
  dashboard: 'لوحة المعلومات',
  'of all 152 SLAs are eligible for automation': 'من إجمالي 152 اتفاقية مؤهلة للأتمتة',
  'of the 135 eligible are automated': 'من الـ135 المؤهلة تمت أتمتتها',
  '100 % automation of eligible SLAs': 'أتمتة 100% من الاتفاقيات المؤهلة',
  'Start end-to-end process-cycle automation': 'بدء أتمتة دورة العمليات الشاملة',
  'Documentation, governance and roadmap': 'التوثيق والحوكمة وخارطة الطريق',
  '11 services and 115 SLAs automated': 'أتمتة 11 خدمة و115 اتفاقية',
  '135 of 152 eligible — 115 automated': '135 من 152 مؤهلة — و115 مؤتمتة',
  'Automation criteria, weighted': 'معايير الأتمتة وأوزانها',
  '2026: 100 % of eligible SLAs': '2026: أتمتة 100% من الاتفاقيات المؤهلة',

  /* ----------------------------------------------------- 6 · standards */
  'April 2025 — TÜV Austria': 'أبريل 2025 — TÜV النمسا',
  'all three — target Q3 2026': 'الثلاثة جميعاً — المستهدف الربع الثالث 2026',
  'Tasheer IMS': 'نظام تأشير', // short enough to sit inside the hub circle
  'with Digital & Technology': 'مع الرقمنة والتقنية',
  'with GRC': 'مع الحوكمة والمخاطر والالتزام',
  'with Cybersecurity': 'مع الأمن السيبراني',
  'ISO 9001:2015 — certified April 2025': 'ISO 9001:2015 — شهادة في أبريل 2025',
  '2026: ISO 20000-1, 22301, 27001 by Q3': '2026: ISO 20000-1 و22301 و27001 بحلول الربع الثالث',
  'One integrated management system': 'نظام إدارة متكامل واحد',

  /* ------------------------------------------------- 7 · local content */
  'Local Content score — valid until July 2026': 'درجة المحتوى المحلي — سارية حتى يوليو 2026',
  'compliance score — 2024 performance report': 'درجة الالتزام — تقرير أداء 2024',
  'EY engagement': 'التعاقد مع EY',
  'Feb–Mar': 'فبراير–مارس',
  'Finance & HR data review': 'مراجعة بيانات المالية والموارد البشرية',
  'Apr–May': 'أبريل–مايو',
  'Audit before FS approval': 'التدقيق قبل اعتماد القوائم المالية',
  'May–Jun': 'مايو–يونيو',
  'FS approval': 'اعتماد القوائم المالية',
  Jun: 'يونيو',
  Certificate: 'الشهادة',
  'by 31 July': 'قبل 31 يوليو',
  'Keep Local Content above 70 %': 'المحافظة على المحتوى المحلي فوق 70%',
  'Control local vs foreign at PR level': 'ضبط المحلي مقابل الأجنبي عند مستوى طلب الشراء',
  'Improve or replace low-LC vendors': 'تحسين أو استبدال الموردين منخفضي المحتوى المحلي',
  'Maintain Saudization %': 'المحافظة على نسبة السعودة',
  '100 % reporting compliance': 'التزام 100% بالتقارير',
  'Local Content 75.81 % — above the 70 % line': 'المحتوى المحلي 75.81% — فوق حد الـ70%',
  '96.25 % compliance, 2024 report': 'نسبة التزام 96.25% — تقرير 2024',
  '2026: certified before 31 July': '2026: الشهادة قبل 31 يوليو',

  /* ------------------------------------------------------- 8 · reports */
  'reports submitted': 'تقريراً تم تقديمه',
  '100 % on deadline': '100% في الموعد المحدد',
  'in coordination with stakeholders': 'بالتنسيق مع أصحاب العلاقة',
  'Maintain 100 % on-time submission': 'المحافظة على التقديم في الموعد بنسبة 100%',
  '20 TIC/PIF reports — 100 % on time': '20 تقريراً — 100% في الموعد',
  '2026: keep it at 100 %': '2026: الاستمرار عند 100%',

  /* ------------------------------------------------------ 9 · training */
  'EFQM Foundation': 'أساسيات EFQM',
  'two candidates trained': 'تدريب مرشحَين',
  'delivered to teams': 'نُفّذ للفرق',
  '4–5 internal auditors': '4–5 مدققين داخليين',
  'Awareness for all Tasheer employees — ISO 27001 & ISO 22301':
    'توعية لجميع موظفي تأشير — ISO 27001 وISO 22301',
  'EFQM Foundation — two trained; ISO 9001 delivered': 'أساسيات EFQM — تدريب اثنين؛ وتنفيذ ISO 9001',
  '2026: auditors for three standards, awareness for all': '2026: مدققون لثلاثة معايير وتوعية للجميع',

  /* ---------------------------------------------------- 10 · excellence */
  'two candidates trained — EFQM Foundation': 'تدريب مرشحَين — أساسيات EFQM',
  'Internal assessment against KAQA (tentative)': 'تقييم داخلي وفق جائزة الملك عبدالعزيز للجودة (مبدئي)',
  'gap analysis and strategic plan — no score claimed yet':
    'تحليل الفجوات والخطة الاستراتيجية — لم تُعلن أي نتيجة بعد',
  'The road to 2028': 'الطريق إلى 2028',
  'ISO 9001 — QMS': 'ISO 9001 — نظام إدارة الجودة',
  'KAQA assessment · ISO 20400 · ISO 10001 · ISO 30405':
    'تقييم جائزة الملك عبدالعزيز · ISO 20400 · ISO 10001 · ISO 30405',
  'EFQM assessment': 'تقييم EFQM',
  'Two trained on EFQM Foundation': 'تدريب اثنين على أساسيات EFQM',
  '2026: KAQA internal assessment': '2026: تقييم داخلي وفق جائزة الملك عبدالعزيز للجودة',
  'The road to 2028: KAQA, then EFQM': 'الطريق إلى 2028: جائزة الملك عبدالعزيز ثم EFQM',

  /* ------------------ kept in Latin, as Tasheer does in its own Arabic */
  'ISO 9001:2015': 'ISO 9001:2015',
  'ISO/IEC 20000-1': 'ISO/IEC 20000-1',
  'ISO 22301': 'ISO 22301',
  'ISO/IEC 27001': 'ISO/IEC 27001',
  'ISO 9001': 'ISO 9001',
  'ISO 22301 · ISO/IEC 27001 · ISO/IEC 20000-1': 'ISO 22301 · ISO/IEC 27001 · ISO/IEC 20000-1',
  EFQM: 'EFQM',
  '2025': '2025',
  '2026': '2026',
  '2027': '2027',
  '2028': '2028',
};

/** Look a string up by its English original. Missing keys fall back, loudly. */
export function t(en: string): string {
  if (LANG !== 'ar') return en;
  const value = AR[en];
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.error(`[copy] no Arabic for: ${en}`);
    return en;
  }
  return value;
}
