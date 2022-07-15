/**
 * A function to return how far another date is away from the current date.
 * @date 7/6/2022 - 12:52:04 PM
 *
 * @param {Date} date
 */
 function getTimeAgo(date: Date) {
	// @ts-ignore
	var seconds = Math.floor((new Date() - date) / 1000);

	var interval = seconds / 31536000;

	const mod = (name: string) => {
		let floor = Math.floor(interval);
		return floor + " " + name + (floor > 1 ? "s": "");
	}
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
	interval = seconds
	return mod("second");
}

function formatDate(date: Date) {
	const pad = (x: string | number) => x.toString().trim().padStart(2, "0");

	const months = [
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

	return `${months[date.getMonth()]} ${pad(
		date.getDate()
	)} ${date.getFullYear()} ${pad(date.getHours())}:${pad(
		date.getMinutes()
	)}:${pad(date.getSeconds())}`;
}

export { getTimeAgo, formatDate }