"use strict";

/* =========================================================
   KSU SMARTPLAN - PRESENTATION DATA NORMALIZER
========================================================= */

(function () {

    if (
        typeof KSU_COURSES === "undefined" ||
        !Array.isArray(KSU_COURSES)
    ) {
        console.error("KSU_COURSES not available.");
        return;
    }


    /* =====================================================
       1-2. KEEP ORIGINAL COURSE DATABASE

       IMPORTANT:
       Do NOT remove records by course code or course name.

       Different sections / offerings may belong to the same
       course. The original Fall 2026 database must remain
       complete.

       Exact offering selection is handled separately using
       offeringId.
    ===================================================== */

    /* =====================================================
       2.5 OFFICIAL FALL 2026 GLOBAL-COLLEGE GENERAL COURSES
       Source: KSU Fall 2026 Course Registration Guide.
       Regular day/time is demo-generated unless explicitly noted.
    ===================================================== */

    const OFFICIAL_GENERAL_COURSES = [
        // Basic General Education
        ...["001","002","003","004","005","006","007","008"].map((n, i) => ({code:`QY025${n}`, name:"Korean Speaking & Listening(2)", department:"Global College", grade:null, category:"Basic General Education", credits:2, professor:i < 2 ? "Min Sang-Hi" : "(New professor)"})),
        {code:"QY031001",name:"Korean Reading and Writing(2)",department:"Global College",grade:null,category:"Basic General Education",credits:2,professor:"Min Sang-Hi"},
        ...["002","003","004"].map(n => ({code:`QY031${n}`,name:"Korean Reading and Writing(2)",department:"Global College",grade:null,category:"Basic General Education",credits:2,professor:"(New professor)"})),
        {code:"QY032019",name:"Korean Vocabulary and Grammar",department:"Global College",grade:null,category:"Basic General Education",credits:2,professor:"(New professor)"},
        {code:"QY032020",name:"Korean Vocabulary and Grammar",department:"Global College",grade:null,category:"Basic General Education",credits:2,professor:"(New professor)"},
        {code:"QY022001",name:"Korean Manners & Customs",department:"Global College",grade:null,category:"Basic General Education",credits:2,professor:"Wang Jue",deliveryType:"Online"},

        // CELL
        {code:"NB068001",name:"Air Transportation: Laws, Regulators and Associations",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Laleesha Angelee Chamberlain",deliveryType:"CELL"},
        {code:"NB069001",name:"Destination Marketing",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Nathaniel Aaron Saul",deliveryType:"CELL"},
        {code:"NB070001",name:"Introduction to MICE Industry and Destinations",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Sandy Kyunghwa Nam-Jo",deliveryType:"CELL"},
        {code:"NB120001",name:"Global Culture & Manner",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"BAN, HYUNJEONG",deliveryType:"CELL"},
        {code:"NB144001",name:"Generative AI Applications",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Suresh Alapati",deliveryType:"CELL"},
        {code:"NB145001",name:"Fundamentals of the Internet of Things and its Applications",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Pham Trung Hieu",deliveryType:"CELL"},
        {code:"NB138002",name:"비즈니스를통해배우는 미래사회의10대기술",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Hwang In-Seob",deliveryType:"CELL"},
        {code:"NB140002",name:"피부과학과화장품학개론",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Yong-Jin Kwon",deliveryType:"CELL"},
        {code:"NB141002",name:"명작으로보는세계사진사",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Lee, Jaegu",deliveryType:"CELL"},
        {code:"NB142002",name:"인체생리에맞는자기관리",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"YOUNG GUN ZO",deliveryType:"CELL"},
        {code:"NB143002",name:"한국의맛,세계를향하다",department:"Global College",grade:null,category:"Elective General Education",credits:1,professor:"Kim, Sung Ok",deliveryType:"CELL"},

        // 100% online elective general education (user demo rule uses 17:00-19:50)
        {code:"YP740001",name:"Next Generation Vehicles",department:"Global College",grade:null,category:"Elective General Education",credits:2,professor:"Suresh Alapati",deliveryType:"Online"},
        {code:"YP797001",name:"TOPIK I Reading Practice and Strategies",department:"Global College",grade:null,category:"Elective General Education",credits:2,professor:"KIM JEE YOUNG",deliveryType:"Online"},
        {code:"YP803001",name:"TOPIK I Listening Practice and Strategies",department:"Global College",grade:null,category:"Elective General Education",credits:2,professor:"KIM JEE YOUNG",deliveryType:"Online"},

        // Korea Immigration & Integration Program (KIIP).
        // The guidebook gives bundled completion credits, not per-course credits,
        // so individual credits are intentionally left unspecified.
        {code:"YP798001",name:"한국어와한국문화입문",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP799001",name:"한국어와한국문화기초(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP800001",name:"한국어와한국문화기초(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP798002",name:"한국어와한국문화입문",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP799002",name:"한국어와한국문화기초(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP800002",name:"한국어와한국문화기초(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP825003",name:"한국어와한국문화초급(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP826003",name:"한국어와한국문화초급(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP827001",name:"한국어와한국문화중급(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP828001",name:"한국어와한국문화중급(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP801001",name:"한국어와한국문화고급(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP802001",name:"한국어와한국문화고급(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP663001",name:"한국사회이해(1)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},
        {code:"YP665001",name:"한국사회이해(2)",department:"Global College",grade:null,category:"KIIP",credits:null,professor:"Not specified"},

        // Elective General Education
        {code:"YP241001",name:"BASIC KOREAN READING(1) / 초급한국어읽기(1)",professor:"(New professor)"},
        {code:"YP243001",name:"BASIC KOREAN CONVERSATION(1) / 초급한국어회화(1)",professor:"(New professor)"},
        {code:"YP587001",name:"Sustainable Tourism",professor:"Nathaniel Aaron Saul"},
        {code:"YP588001",name:"Introduction to New And Renewable Energy Technology",professor:"julfikhsan Ahmad Mukhti"},
        {code:"YP589001",name:"Introduction to Digital Transformation Industry 4.0",professor:"(New professor)"},
        {code:"YP590001",name:"Startup Businesses Planning",professor:"Joeffrey Calimag"},
        {code:"YP635001",name:"Coffee&Culture",professor:"CHO JA YEON"},
        {code:"YP637001",name:"Introduction to Programming",professor:"(New professor)"},
        {code:"YP638001",name:"Energy Storage Solutions",professor:"Grace Firsta Lukman"},
        {code:"YP639001",name:"Introduction to Financial Accounting",professor:"Dandach Ghiwa"},
        {code:"YP641001",name:"Green Business",professor:"JAVIER HERRERA"},
        {code:"YP656001",name:"Global Awareness and Current Issues",professor:"(New professor)"},
        {code:"YP657001",name:"Online Reputation Management",professor:"RIANMAHARDHIKA"},
        {code:"YP658001",name:"General Physics",professor:"Suresh Alapati"},
        {code:"YP659001",name:"Entrepreneurship",professor:"Sakshi Chhabra"},
        {code:"YP660001",name:"Electricity-Attractive and practical concepts",professor:"Abrar Siddique"},
        {code:"YP661001",name:"College life guidance for foreign students / 외국인유학생을위한한국사회문화읽기",professor:"HUH WOOK"},
        {code:"YP661002",name:"College life guidance for foreign students / 외국인유학생을위한한국사회문화읽기",professor:"HUH WOOK"},
        {code:"YP662001",name:"Korean society and basic law / 외국인유학생을위한한국법의이해",professor:"HUH WOOK"},
        {code:"YP672001",name:"Introduction to 2D Game Design and Development",professor:"(New professor)"},
        {code:"YP673001",name:"Major Events In Recent Korean History",professor:"Lee Sae Beul"},
        {code:"YP718001",name:"Business Communication in Hospitality",professor:"Nathaniel Aaron Saul"},
        {code:"YP768001",name:"Global Governance & International Organizations",professor:"(New professor)"},
        {code:"YP769001",name:"Viral Marketing and Media Dynamics",professor:"(New professor)"},
        {code:"YP770001",name:"Chapel for International Students",professor:"Santosh Kumar Bardhan"},
        {code:"YP994001",name:"Introduction To Computer Science / 컴퓨터개론",professor:"(New professor)"},
        {code:"YP996002",name:"Practical Service Korean / 실무서비스한국어",professor:"(New professor)"}
    ].map(c => ({department:"Global College",grade:null,category:"Elective General Education",credits:2,deliveryType:"Regular",...c}));

    // Add only courses not already present by official course code.
    const existingCodes = new Set(KSU_COURSES.map(c => String(c.code || "").trim()));
    OFFICIAL_GENERAL_COURSES.forEach(c => {
        if (!existingCodes.has(c.code)) {
            KSU_COURSES.push(c);
            existingCodes.add(c.code);
        }
    });

    // Remove only true duplicated source records. Distinct course codes/sections remain.
    const exactSeen = new Set();
    const exactUnique = KSU_COURSES.filter(c => {
        const key = [c.code,c.department]
            .map(v => String(v ?? "").trim()).join("||");
        if (exactSeen.has(key)) return false;
        exactSeen.add(key);
        return true;
    });
    KSU_COURSES.splice(0, KSU_COURSES.length, ...exactUnique);

    /* =====================================================
       3. KSU PRESENTATION TIME RULES
    ===================================================== */

    const DAYS = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ];


    const BLOCKS = {

        1: [
            {
                periods: [2],
                start: "09:00",
                end: "09:50"
            },
            {
                periods: [3],
                start: "10:00",
                end: "10:50"
            },
            {
                periods: [4],
                start: "11:00",
                end: "11:50"
            },
            {
                periods: [6],
                start: "13:00",
                end: "13:50"
            },
            {
                periods: [7],
                start: "14:00",
                end: "14:50"
            },
            {
                periods: [8],
                start: "15:00",
                end: "15:50"
            },
            {
                periods: [9],
                start: "16:00",
                end: "16:50"
            },
            {
                periods: [10],
                start: "17:00",
                end: "17:50"
            }
        ],


        2: [
            {
                periods: [2, 3],
                start: "09:00",
                end: "10:50"
            },
            {
                periods: [3, 4],
                start: "10:00",
                end: "11:50"
            },
            {
                periods: [6, 7],
                start: "13:00",
                end: "14:50"
            },
            {
                periods: [7, 8],
                start: "14:00",
                end: "15:50"
            },
            {
                periods: [9, 10],
                start: "16:00",
                end: "17:50"
            }
        ],


        3: [
            {
                periods: [2, 3, 4],
                start: "09:00",
                end: "11:50"
            },
            {
                periods: [6, 7, 8],
                start: "13:00",
                end: "15:50"
            },
            {
                periods: [9, 10, 11],
                start: "16:00",
                end: "18:50"
            }
        ]
    };


    /* =====================================================
       4. PROFESSOR CONFLICT CONTROL
    ===================================================== */

    const reservations = new Map();


    function professorKey(professor) {

        const value =
            String(professor || "")
                .trim()
                .toLowerCase();

        /*
           "(New professor)" is a placeholder,
           not one actual professor.
        */

        if (
            !value ||
            value.includes("new professor")
        ) {
            return "";
        }

        return value;
    }


    function overlap(a, b) {

        return a.some(period =>
            b.includes(period)
        );
    }


    function isProfessorFree(
        professor,
        day,
        periods
    ) {

        const key =
            professorKey(professor);

        if (!key) {
            return true;
        }

        const existing =
            reservations.get(key) || [];

        return !existing.some(item =>
            item.day === day &&
            overlap(
                item.periods,
                periods
            )
        );
    }


    function reserve(
        professor,
        day,
        periods
    ) {

        const key =
            professorKey(professor);

        if (!key) {
            return;
        }

        if (!reservations.has(key)) {
            reservations.set(key, []);
        }

        reservations
            .get(key)
            .push({
                day: day,
                periods: [...periods]
            });
    }


    /* =====================================================
       5. ONLINE / CELL DETECTION
    ===================================================== */

    function isOnlineOrCell(course) {

        const delivery =
            String(
                course.deliveryType || ""
            )
            .trim()
            .toLowerCase();

        return (
            course.online === true ||
            course.cell === true ||
            delivery === "online" ||
            delivery === "cell"
        );
    }


    /* =====================================================
       6. ASSIGN SCHEDULES
    ===================================================== */

    KSU_COURSES.forEach(
        (course, index) => {

            let blocks;


            /*
               ONLINE / CELL SPECIAL RULE

               Always 17:00 - 19:50
               regardless of 1/2 credit.
            */

            if (isOnlineOrCell(course)) {

                blocks = [
                    {
                        periods: [10, 11, 12],
                        start: "17:00",
                        end: "19:50"
                    }
                ];

            } else {

                const credits =
                    Number(course.credits);

                blocks =
                    BLOCKS[credits] ||
                    BLOCKS[1];
            }


            /*
               Rotate both day and time.
               This creates morning /
               afternoon / evening variety.
            */

            const dayStart =
                index % DAYS.length;

            const blockStart =
                index % blocks.length;


            let assigned = false;


            for (
                let d = 0;
                d < DAYS.length && !assigned;
                d++
            ) {

                const day =
                    DAYS[
                        (dayStart + d) %
                        DAYS.length
                    ];


                for (
                    let b = 0;
                    b < blocks.length && !assigned;
                    b++
                ) {

                    const block =
                        blocks[
                            (blockStart + b) %
                            blocks.length
                        ];


                    if (
                        !isProfessorFree(
                            course.professor,
                            day,
                            block.periods
                        )
                    ) {
                        continue;
                    }


                    course.schedule = {

                        day: day,

                        periods:
                            [...block.periods],

                        startTime:
                            block.start,

                        endTime:
                            block.end,

                        source:
                            isOnlineOrCell(course)
                                ? "presentation-online"
                                : "presentation-generated"
                    };


                    reserve(
                        course.professor,
                        day,
                        block.periods
                    );


                    assigned = true;
                }
            }


            /* =============================================
               UNIQUE OFFERING ID
            ============================================= */

            const schedule =
                course.schedule || {};


            course.offeringId = [

                course.code ||
                    "COURSE",

                schedule.day ||
                    "NO-DAY",

                schedule.startTime ||
                    "NO-START",

                schedule.endTime ||
                    "NO-END",

                index

            ].join("__");
        }
    );


    /* =====================================================
       7. VALIDATION
    ===================================================== */

    const invalidRegular =
        KSU_COURSES.filter(course => {

            if (
                !course.schedule ||
                isOnlineOrCell(course)
            ) {
                return false;
            }

            return (
                course.schedule.startTime ===
                    "08:00" ||

                course.schedule.startTime ===
                    "12:00"
            );
        });


    console.log(
        "KSU SmartPlan presentation fix loaded."
    );

    console.log(
        "Clean course sections:",
        KSU_COURSES.length
    );

    console.log(
        "Invalid regular schedules:",
        invalidRegular.length
    );

})();

