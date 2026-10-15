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
       1. REMOVE EXACT DUPLICATE RECORDS
    ===================================================== */

    const seenCodes = new Set();

    let cleaned = KSU_COURSES.filter(course => {

        const code =
            String(course.code || "").trim();

        if (!code) {
            return true;
        }

        if (seenCodes.has(code)) {
            return false;
        }

        seenCodes.add(code);

        return true;
    });


    /* =====================================================
       2. MAXIMUM TWO OFFERINGS OF SAME COURSE

       Same course name can appear maximum twice.
       Different section codes are allowed.
    ===================================================== */

    const offeringCounts = new Map();

    cleaned = cleaned.filter(course => {

        const key = [
            String(course.department || ""),
            String(course.grade || ""),
            String(course.name || "")
                .trim()
                .toLowerCase()
        ].join("||");

        const count =
            offeringCounts.get(key) || 0;

        if (count >= 2) {
            return false;
        }

        offeringCounts.set(
            key,
            count + 1
        );

        return true;
    });


    /*
       Replace contents without replacing the const array.
    */

    KSU_COURSES.splice(
        0,
        KSU_COURSES.length,
        ...cleaned
    );


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
