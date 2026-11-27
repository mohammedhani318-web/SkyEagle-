import type { Article } from "@/lib/types";

/**
 * محتوى تجريبي (Seed) يُستخدم عند عدم ضبط Supabase.
 * استبدله بمحتوى حقيقي من لوحة الإدارة في المرحلة الرابعة.
 */
export const SEED_ARTICLES: Article[] = [
  {
    slug: "four-forces-of-flight",
    category: "aviation",
    kind: "article",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-10-01",
    title: {
      ar: "القوى الأربع المؤثرة على الطائرة",
      en: "The Four Forces Acting on an Aircraft",
    },
    excerpt: {
      ar: "الرفع والوزن والدفع والسحب: كيف تتوازن هذه القوى لتبقى الطائرة في الجو.",
      en: "Lift, weight, thrust and drag: how these forces balance to keep an aircraft flying.",
    },
    body: {
      ar: [
        "تتأثر أي طائرة أثناء الطيران بأربع قوى أساسية: الرفع (Lift) الذي يدفعها لأعلى، والوزن (Weight) الذي يسحبها نحو الأرض، والدفع (Thrust) الذي يدفعها للأمام، والسحب (Drag) الذي يقاوم حركتها.",
        "في الطيران المستقيم المنتظم عند ارتفاع ثابت يتساوى الرفع مع الوزن ويتساوى الدفع مع السحب. وعندما يختل هذا التوازن تتغير حالة الطائرة: زيادة الدفع عن السحب تعني تسارعًا، وزيادة الرفع عن الوزن تعني صعودًا.",
        "يتولّد الرفع أساسًا من حركة الهواء حول الجناح، ويعتمد على سرعة الطائرة ومساحة الجناح وشكل مقطعه وزاوية الهجوم وكثافة الهواء. أما السحب فله مكوّنات منها السحب الطفيلي والسحب المستحث الناتج عن توليد الرفع.",
      ],
      en: [
        "In flight, an aircraft is acted on by four basic forces: lift, which pushes it upward; weight, which pulls it toward the ground; thrust, which drives it forward; and drag, which resists its motion.",
        "In steady, level, unaccelerated flight, lift equals weight and thrust equals drag. When this balance is disturbed the aircraft's state changes: thrust greater than drag means acceleration, and lift greater than weight means climbing.",
        "Lift is generated mainly by the airflow around the wing and depends on airspeed, wing area, airfoil shape, angle of attack and air density. Drag has several components, including parasite drag and the induced drag that comes with producing lift.",
      ],
    },
  },
  {
    slug: "how-wings-generate-lift",
    category: "aviation",
    kind: "article",
    access: "free",
    readMinutes: 5,
    publishedAt: "2026-10-08",
    title: {
      ar: "كيف يولّد الجناح قوة الرفع؟",
      en: "How Does a Wing Generate Lift?",
    },
    excerpt: {
      ar: "نظرة مبسطة على المقطع الجناحي وزاوية الهجوم وتغيّر الضغط حول الجناح.",
      en: "A simple look at the airfoil, angle of attack and the pressure changes around a wing.",
    },
    body: {
      ar: [
        "المقطع الجناحي (Airfoil) هو شكل مقطع الجناح، وقد صُمّم ليحرف الهواء المار حوله إلى الأسفل مع خلق فرق ضغط بين سطحه العلوي والسفلي.",
        "زاوية الهجوم هي الزاوية بين وتر الجناح واتجاه الهواء القادم. تزداد قوة الرفع بزيادة هذه الزاوية حتى حد معين، وبعده ينفصل الهواء عن السطح العلوي فيحدث الانهيار (Stall) ويفقد الجناح جزءًا كبيرًا من رفعه.",
        "من الأخطاء الشائعة تفسير الرفع بنظرية واحدة فقط. الصورة الأدق أن الرفع ينتج عن توزيع الضغط حول الجناح، وهو ما يتوافق مع قانون نيوتن الثالث ومع معادلة برنولي معًا عند تطبيقهما بشكل صحيح.",
      ],
      en: [
        "An airfoil is the cross-sectional shape of a wing, designed to deflect the air passing around it downward while creating a pressure difference between its upper and lower surfaces.",
        "Angle of attack is the angle between the wing's chord line and the oncoming airflow. Lift increases with this angle up to a limit; beyond it the flow separates from the upper surface, causing a stall and a large loss of lift.",
        "A common mistake is to explain lift with a single theory. The more accurate picture is that lift results from the pressure distribution around the wing, which is consistent with both Newton's third law and Bernoulli's equation when each is applied correctly.",
      ],
    },
  },
  {
    slug: "turbofan-engine-basics",
    category: "aviation",
    kind: "reference",
    access: "free",
    readMinutes: 5,
    publishedAt: "2026-10-15",
    title: {
      ar: "أساسيات محرك التوربوفان",
      en: "Turbofan Engine Basics",
    },
    excerpt: {
      ar: "مراحل عمل المحرك: السحب والضغط والاحتراق والتمدد، ودور المروحة الكبيرة.",
      en: "How the engine works: intake, compression, combustion and expansion, and the role of the large fan.",
    },
    body: {
      ar: [
        "يعمل محرك التوربوفان على مراحل: سحب الهواء، ثم ضغطه في الضاغط، ثم حرقه مع الوقود في غرفة الاحتراق، ثم تمدد الغازات الساخنة عبر التوربين الذي يدير الضاغط والمروحة.",
        "تقوم المروحة الأمامية الكبيرة بدفع كمية كبيرة من الهواء حول قلب المحرك (مجرى الالتفاف)، ويأتي الجزء الأكبر من الدفع في طائرات الركاب الحديثة من هذا الهواء، مما يرفع الكفاءة ويخفض الضجيج مقارنة بالمحركات النفاثة القديمة.",
        "تُعرف نسبة الهواء الملتف إلى الهواء المار في القلب بنسبة الالتفاف (Bypass Ratio)، وهي من أهم مؤشرات كفاءة المحرك.",
      ],
      en: [
        "A turbofan works in stages: it draws in air, compresses it in the compressor, burns it with fuel in the combustor, then expands the hot gases through the turbine that drives the compressor and the fan.",
        "The large front fan pushes a big volume of air around the engine core (the bypass duct). In modern airliners most of the thrust comes from this bypass air, which raises efficiency and cuts noise compared with older turbojets.",
        "The ratio of bypass air to the air passing through the core is called the bypass ratio, one of the key indicators of engine efficiency.",
      ],
    },
  },
  {
    slug: "rocket-equation",
    category: "space",
    kind: "article",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-10-20",
    title: {
      ar: "معادلة تسيولكوفسكي: لماذا الصواريخ ضخمة؟",
      en: "The Tsiolkovsky Rocket Equation: Why Rockets Are Huge",
    },
    excerpt: {
      ar: "العلاقة بين تغيّر السرعة وسرعة العادم وكتلة الوقود في تصميم الصواريخ.",
      en: "The relationship between velocity change, exhaust velocity and propellant mass in rocket design.",
    },
    body: {
      ar: [
        "تربط معادلة تسيولكوفسكي بين التغيّر الممكن في سرعة الصاروخ (Δv) وسرعة عادم المحرك والنسبة بين الكتلة الابتدائية والنهائية: Δv = ve · ln(m0 / mf).",
        "بسبب اللوغاريتم في المعادلة، تتطلب كل زيادة صغيرة في Δv زيادة كبيرة في كتلة الوقود. ولهذا يكون الوقود الجزء الأكبر من كتلة الصاروخ عند الإقلاع.",
        "ومن هنا جاءت فكرة الصواريخ متعددة المراحل: التخلص من الكتلة الفارغة بعد استهلاك الوقود يحسّن النسبة الفعالة ويزيد Δv الإجمالية.",
      ],
      en: [
        "The Tsiolkovsky equation links a rocket's achievable velocity change (Δv) to the engine's exhaust velocity and the ratio of initial to final mass: Δv = ve · ln(m0 / mf).",
        "Because of the logarithm, each small increase in Δv requires a large increase in propellant mass. That is why propellant makes up most of a rocket's mass at liftoff.",
        "This is the reasoning behind staging: discarding empty structure after the propellant is used improves the effective mass ratio and increases total Δv.",
      ],
    },
  },
  {
    slug: "orbit-types",
    category: "space",
    kind: "article",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-10-27",
    title: {
      ar: "أنواع المدارات: LEO وMEO وGEO",
      en: "Orbit Types: LEO, MEO and GEO",
    },
    excerpt: {
      ar: "الفرق بين المدارات المنخفضة والمتوسطة والثابتة بالنسبة للأرض واستخداماتها.",
      en: "The differences between low, medium and geostationary orbits and what each is used for.",
    },
    body: {
      ar: [
        "المدار الأرضي المنخفض (LEO) يقع على ارتفاعات تصل تقريبًا إلى ألفي كيلومتر، وتدور فيه محطة الفضاء الدولية وكثير من أقمار رصد الأرض، ويتميز بزمن اتصال قصير وزمن دورة نحو ساعة ونصف.",
        "المدار المتوسط (MEO) يقع بين المنخفض والثابت، وتُستخدم فيه عادة أقمار أنظمة الملاحة العالمية.",
        "المدار الثابت بالنسبة للأرض (GEO) على ارتفاع نحو 35,786 كم فوق خط الاستواء، وفيه تتساوى دورة القمر مع دوران الأرض فيبدو ثابتًا في السماء، وهو مناسب للاتصالات والبث والأرصاد.",
      ],
      en: [
        "Low Earth orbit (LEO) extends up to roughly 2,000 km altitude. The International Space Station and many Earth-observation satellites orbit there, with short communication delays and an orbital period of about an hour and a half.",
        "Medium Earth orbit (MEO) lies between LEO and GEO and is typically used by global navigation satellite constellations.",
        "Geostationary orbit (GEO) sits at about 35,786 km above the equator, where the satellite's period matches Earth's rotation so it appears fixed in the sky. It suits communications, broadcasting and weather monitoring.",
      ],
    },
  },
  {
    slug: "satellite-subsystems",
    category: "space",
    kind: "reference",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-11-03",
    title: {
      ar: "الأنظمة الفرعية للقمر الصناعي",
      en: "Satellite Subsystems",
    },
    excerpt: {
      ar: "نظرة عامة على الطاقة والاتصالات والتحكم في الوضعية والتحكم الحراري.",
      en: "An overview of power, communications, attitude control and thermal control.",
    },
    body: {
      ar: [
        "يتكون القمر الصناعي من حمولة المهمة (مثل الكاميرا أو جهاز الاتصال) ومنصة تدعمها بأنظمة فرعية متعددة.",
        "من أهم الأنظمة الفرعية: نظام الطاقة (ألواح شمسية وبطاريات)، ونظام الاتصالات، ونظام التحكم في الوضعية (Attitude Control) لتوجيه القمر، ونظام التحكم الحراري، ونظام الدفع لتصحيح المدار، ونظام التحكم في البيانات.",
        "يُصمَّم كل نظام وفق متطلبات المهمة وقيود الكتلة والطاقة والكلفة، وتُراجع التفاعلات بينها في مراحل التصميم المختلفة.",
      ],
      en: [
        "A satellite consists of a mission payload (such as a camera or communications transponder) and a bus that supports it through several subsystems.",
        "Key subsystems include power (solar arrays and batteries), communications, attitude control to point the satellite, thermal control, propulsion for orbit corrections, and command and data handling.",
        "Each subsystem is designed against mission requirements and constraints on mass, power and cost, and their interactions are reviewed at each design stage.",
      ],
    },
  },
  {
    slug: "maintenance-check-types",
    category: "maintenance",
    kind: "article",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-11-05",
    title: {
      ar: "أنواع فحوصات صيانة الطائرات",
      en: "Types of Aircraft Maintenance Checks",
    },
    excerpt: {
      ar: "من الفحص قبل الطيران إلى الفحوصات الدورية الكبرى: ما الفرق بينها؟",
      en: "From pre-flight checks to major scheduled checks: what sets them apart?",
    },
    body: {
      ar: [
        "تُنفَّذ الصيانة وفق برنامج صيانة معتمد من الشركة المصنّعة والجهة التنظيمية، ويتدرج من فحوصات سريعة متكررة إلى فحوصات أعمق على فترات أطول.",
        "تشمل الفحوصات الخفيفة الفحص قبل الطيران أو اليومي، وفحوصات الخط الدورية التي تُجرى بين الرحلات أو بشكل أسبوعي. أما الفحوصات الثقيلة (مثل فحص C وما فوقه حسب برنامج كل طائرة) فتتطلب إيقاف الطائرة في حظيرة وفتح مناطق واسعة من الهيكل والأنظمة.",
        "تختلف الأسماء والفواصل الزمنية من طراز لآخر ومن مشغّل لآخر، لذا يُرجع دائمًا إلى برنامج الصيانة المعتمد للطائرة المعنية.",
      ],
      en: [
        "Maintenance follows a program approved by the manufacturer and the regulator, ranging from quick, frequent checks to deeper inspections at longer intervals.",
        "Light checks include pre-flight or daily checks and periodic line checks carried out between flights or weekly. Heavy checks (such as a C-check and above, depending on each aircraft's program) require the aircraft to be taken into a hangar with large areas of structure and systems opened up.",
        "Names and intervals vary by aircraft type and operator, so the approved maintenance program for the specific aircraft should always be consulted.",
      ],
    },
  },
  {
    slug: "ndt-methods",
    category: "maintenance",
    kind: "reference",
    access: "free",
    readMinutes: 5,
    publishedAt: "2026-11-10",
    title: {
      ar: "الفحص غير الإتلافي (NDT) في صيانة الطائرات",
      en: "Non-Destructive Testing (NDT) in Aircraft Maintenance",
    },
    excerpt: {
      ar: "طرق الكشف عن العيوب دون الإضرار بالقطعة: البصري والسوائل النافذة والجسيمات المغناطيسية والتيارات الدوامية والموجات فوق الصوتية.",
      en: "Ways to detect defects without damaging the part: visual, dye penetrant, magnetic particle, eddy current and ultrasonic.",
    },
    body: {
      ar: [
        "يهدف الفحص غير الإتلافي إلى كشف الشقوق والتآكل والعيوب الداخلية دون إتلاف القطعة أو إخراجها من الخدمة بلا داعٍ.",
        "من الطرق الشائعة: الفحص البصري، والسوائل النافذة لكشف الشقوق السطحية، والجسيمات المغناطيسية للمعادن الحديدية المغناطيسية، والتيارات الدوامية للمعادن الموصلة، والموجات فوق الصوتية والأشعة السينية للعيوب الداخلية.",
        "يختار الفني الطريقة حسب نوع المادة وموقع العيب المحتمل ودليل الصيانة الخاص بالطائرة، ويجب أن يكون الفاحص مؤهلًا ومعتمدًا وفق المعايير المعمول بها.",
      ],
      en: [
        "Non-destructive testing aims to find cracks, corrosion and internal flaws without damaging the part or taking it out of service unnecessarily.",
        "Common methods include visual inspection, dye penetrant for surface cracks, magnetic particle for ferromagnetic metals, eddy current for conductive metals, and ultrasonic and X-ray methods for internal defects.",
        "The technician chooses the method based on the material, the location of the possible defect and the aircraft's maintenance manual, and inspectors must be qualified and certified to the applicable standards.",
      ],
    },
  },
  {
    slug: "aircraft-structure-basics",
    category: "maintenance",
    kind: "article",
    access: "free",
    readMinutes: 4,
    publishedAt: "2026-11-14",
    title: {
      ar: "هيكل الطائرة: الأجزاء والمواد",
      en: "Aircraft Structure: Parts and Materials",
    },
    excerpt: {
      ar: "تعرّف على الجسم والأجنحة والذيل، والمواد المستخدمة من الألومنيوم إلى المواد المركبة.",
      en: "Meet the fuselage, wings and tail, and the materials used from aluminum to composites.",
    },
    body: {
      ar: [
        "يتكون هيكل الطائرة من الجسم (Fuselage) والأجنحة ومجموعة الذيل وأسطح التحكم ومعدات الهبوط، ويجب أن يتحمل أحمال الطيران والهبوط والضغط داخل المقصورة بأقل وزن ممكن.",
        "استُخدمت سبائك الألومنيوم على نطاق واسع لسنوات طويلة، ولا تزال شائعة، بينما تزداد حصة المواد المركبة كألياف الكربون في الطائرات الحديثة لخفة وزنها ومقاومتها للإجهاد.",
        "تتطلب المواد المركبة أساليب فحص وإصلاح مختلفة عن المعادن، ولذلك يحتاج فنيو الصيانة إلى تدريب خاص عليها.",
      ],
      en: [
        "An aircraft structure consists of the fuselage, wings, tail assembly, control surfaces and landing gear, and it must withstand flight loads, landing loads and cabin pressurization at the lowest possible weight.",
        "Aluminum alloys have been widely used for many years and remain common, while composites such as carbon fiber account for a growing share of modern aircraft thanks to their light weight and fatigue resistance.",
        "Composites need different inspection and repair methods from metals, so maintenance technicians require specific training for them.",
      ],
    },
  },
];
