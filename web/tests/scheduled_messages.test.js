"use strict";

const {strict: assert} = require("assert");

const {zrequire} = require("./lib/namespace");
const {run_test} = require("./lib/test");

const scheduled_messages = zrequire("scheduled_messages");

const per_day_stamps = {
    "2023-04-30": {
        today_nine_am: 1682845200000,
        today_four_pm: 1682870400000,
        tomorrow_nine_am: 1682931600000,
        tomorrow_four_pm: 1682956800000,
    },
    "2023-05-01": {
        today_nine_am: 1682931600000,
        today_four_pm: 1682956800000,
        tomorrow_nine_am: 1683018000000,
        tomorrow_four_pm: 1683043200000,
    },
    "2023-05-02": {
        today_nine_am: 1683018000000,
        today_four_pm: 1683043200000,
        tomorrow_nine_am: 1683104400000,
        tomorrow_four_pm: 1683129600000,
    },
    "2023-05-03": {
        today_nine_am: 1683104400000,
        today_four_pm: 1683129600000,
        tomorrow_nine_am: 1683190800000,
        tomorrow_four_pm: 1683216000000,
    },
    "2023-05-04": {
        today_nine_am: 1683190800000,
        today_four_pm: 1683216000000,
        tomorrow_nine_am: 1683277200000,
        tomorrow_four_pm: 1683302400000,
    },
    "2023-05-05": {
        today_nine_am: 1683277200000,
        today_four_pm: 1683302400000,
        tomorrow_nine_am: 1683363600000,
        tomorrow_four_pm: 1683388800000,
    },
    "2023-05-06": {
        today_nine_am: 1683363600000,
        today_four_pm: 1683388800000,
        tomorrow_nine_am: 1683450000000,
        tomorrow_four_pm: 1683475200000,
    },
};

function get_expected_send_opts(day, expecteds) {
    const modal_opts = {
        send_later_tomorrow: {
            tomorrow_nine_am: {
                text: "translated: Tomorrow at 9:00 AM",
                stamp: per_day_stamps[day].tomorrow_nine_am,
            },
            tomorrow_four_pm: {
                text: "translated: Tomorrow at 4:00 PM",
                stamp: per_day_stamps[day].tomorrow_four_pm,
            },
        },
        send_later_custom: {
            text: "translated: Custom",
        },
        possible_send_later_today: false,
        possible_send_later_monday: false,
    };
    const optional_modal_opts = {
        send_later_today: {
            today_nine_am: {
                text: "translated: Today at 9:00 AM",
                stamp: per_day_stamps[day].today_nine_am,
            },
            today_four_pm: {
                text: "translated: Today at 4:00 PM",
                stamp: per_day_stamps[day].today_four_pm,
            },
        },
        send_later_monday: {
            monday_nine_am: {
                text: "translated: Monday at 9:00 AM",
                stamp: 1683536400000, // this is always the Monday 9:00 AM time for the week of 2023-04-30
            },
        },
    };

    // 'today_nine_am'
    // 'today_four_pm'
    // 'monday_nine_am'
    for (const expect of expecteds) {
        const day = expect.split("_")[0]; // "today", "monday"
        if (!modal_opts[`possible_send_later_${day}`]) {
            modal_opts[`possible_send_later_${day}`] = {};
        }
        modal_opts[`possible_send_later_${day}`][expect] =
            optional_modal_opts[`send_later_${day}`][expect];
    }

    return modal_opts;
}

run_test("scheduled_modal_opts", () => {
    // Sunday thru Saturday
    const days = [
        "2023-04-30",
        "2023-05-01",
        "2023-05-02",
        "2023-05-03",
        "2023-05-04",
        "2023-05-05",
        "2023-05-06",
    ];
    // Extra options change based on the hour of day
    const options_by_hour = [
        {hour: "T06:00:00", extras: ["today_nine_am", "today_four_pm"]},
        {hour: "T08:54:00", extras: ["today_nine_am", "today_four_pm"]},
        {hour: "T08:57:00", extras: ["today_four_pm"]},
        {hour: "T11:00:00", extras: ["today_four_pm"]},
        {hour: "T13:54:00", extras: ["today_four_pm"]},
        {hour: "T13:57:00", extras: []},
        {hour: "T17:00:00", extras: []},
    ];

    // Now we can test those hourly options on each day of the week
    for (const day of days) {
        for (const opts of options_by_hour) {
            const date = new Date(day + opts.hour);
            // On Fridays (5) and Saturdays (6), add the Monday option
            if (date.getDay() > 4) {
                opts.extras.push("monday_nine_am");
            }
            const modal_opts = scheduled_messages.get_filtered_send_opts(date);
            const expected_opts = get_expected_send_opts(day, opts.extras);
            assert.deepEqual(modal_opts, expected_opts);
        }
    }
});

run_test("missing_or_expired_timestamps", () => {
    let now_in_seconds = new Date("2023-05-03T08:54:00").getTime();
    // The today at 9am option is not expired as of 8:54am (false)
    assert.ok(
        !scheduled_messages.is_send_later_timestamp_missing_or_expired(
            per_day_stamps["2023-05-03"].today_nine_am / 1000,
            now_in_seconds / 1000,
        ),
    );
    // The today at 9am option is expired as of 8:57am (true)
    now_in_seconds = new Date("2023-05-03T08:57:00").getTime();
    assert.ok(
        scheduled_messages.is_send_later_timestamp_missing_or_expired(
            per_day_stamps["2023-05-03"].today_nine_am / 1000,
            now_in_seconds / 1000,
        ),
    );
});
