export const formatTimestamp = (timestamp, options = {}) => {
    const date = timestamp.toDate();

    const {
        showDay = true,
        showMonth = true,
        showYear = true,
        showHour = true,
        showMinute = true,
        showSecond = true
    } = options;

    const formatOptions = {};

    if (showDay) formatOptions.day = '2-digit';
    if (showMonth) formatOptions.month = '2-digit';
    if (showYear) formatOptions.year = 'numeric';
    if (showHour || showMinute || showSecond) {
        formatOptions.hour = showHour ? '2-digit' : undefined;
        formatOptions.minute = showMinute ? '2-digit' : undefined;
        formatOptions.second = showSecond ? '2-digit' : undefined;
    }

    return date.toLocaleDateString('fr-FR', formatOptions);
};