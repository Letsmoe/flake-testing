/**
 * A function to return how far another date is away from the current date.
 * @date 7/6/2022 - 12:52:04 PM
 *
 * @param {Date} date
 */
function getTimeAgo(date) {
    // @ts-ignore
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    var mod = function (name) {
        var floor = Math.floor(interval);
        return floor + " " + name + (floor > 1 ? "s" : "");
    };
    interval = seconds / 31536000;
    if (interval > 1) {
        return mod("year");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return mod("month");
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return mod("day");
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return mod("hour");
    }
    interval = seconds / 60;
    if (interval > 1) {
        return mod("minute");
    }
    interval = seconds;
    return mod("second");
}
function formatDate(date) {
    var pad = function (x) { return x.toString().trim().padStart(2, "0"); };
    var months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return "".concat(months[date.getMonth()], " ").concat(pad(date.getDate()), " ").concat(date.getFullYear(), " ").concat(pad(date.getHours()), ":").concat(pad(date.getMinutes()), ":").concat(pad(date.getSeconds()));
}
export { getTimeAgo, formatDate };
//# sourceMappingURL=Date.js.map