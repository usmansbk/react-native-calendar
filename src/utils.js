import moment from 'moment';

export const NUMBER_OF_ROWS = 6;
const DAYS_PER_WEEK = 7;
const DAYS_PER_PAGE = NUMBER_OF_ROWS * DAYS_PER_WEEK;
const DAY_FORMAT = 'ddd'; // SUN MON TUE WED THU FRI SAT

export function getDate() {
  return moment();
}

export function getMonth(date) {
  return moment(date).month();
}

export function getNextMonth(date) {
  return moment(date).add(1, 'month');
}

export function getPreviousMonth(date) {
  return moment(date).subtract(1, 'month');
}

export function formatMonthHeader(date) {
  return moment(date).format('MMMM YYYY');
}

export function getDateRow(date) {
  const momentDate = moment(date);
  const firstDateOfMonth = momentDate.clone().startOf('month');
  const firstStartOfWeek = firstDateOfMonth.clone().startOf('week');
  const numberOfDaysFromStart = momentDate.diff(firstStartOfWeek, 'days');

  return Math.floor(numberOfDaysFromStart / DAYS_PER_WEEK);
}

export function getDaysOfWeek(format = DAY_FORMAT) {
  let daysOfWeek = [];
  let firstDayOfWeek = moment().startOf('week');

  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    daysOfWeek.push(firstDayOfWeek.clone().add(i, 'day').format(format));
  }

  return daysOfWeek;
}

/**
 *
 * returns a 7 by 6 multidimensional array of the given date month.
 * example if date is December 10, the function will return
 * [
 *  [30, 1, 2, 3, 4, 5, 6],
 *  [7, 8, 9, 10, 11, 12, 13],
 *  [14, 15, 16, 17, 18, 19, 20],
 *  [21, 22, 23, 24, 25, 26, 27],
 *  [28, 29, 30, 31, 1, 2, 3],
 *  [4, 5, 6, 7, 8, 9, 10]
 * ]
 * @param {moment.Moment} date
 */
export function generateMonthMatrix(date) {
  const momentDate = moment(date);
  const firstDateOfMonth = momentDate.clone().startOf('month');
  const firstStartOfWeek = firstDateOfMonth.clone().startOf('week');

  const rows = [];

  for (let i = 0; i < DAYS_PER_PAGE; i += DAYS_PER_WEEK) {
    const row = [];
    for (let j = i; j < i + DAYS_PER_WEEK; j++) {
      const day = firstStartOfWeek.clone().add(j, 'day');
      row.push({
        date: day.date(),
        month: day.month(),
        year: day.year(),
        isoString: day.toISOString(),
        isInMonth: day.isSame(momentDate, 'month'),
      });
    }
    rows.push(row);
  }

  return {name: momentDate.format('MMMM'), rows};
}

export function isSameMonth(date1, date2) {
  return moment(date1).isSame(date2, 'month');
}

export function isToday(date) {
  return isSameDay(moment(), date);
}

export function isSameDay(date1, date2) {
  return moment(date1).isSame(date2, 'day');
}

export function isMarked(markedDates = [], date) {
  return markedDates.some((val) => moment(val).isSame(date, 'day'));
}

export const mockMarkedDates = [
  moment().toISOString(),
  moment().add(3, 'days').toISOString(),
  moment().add(8, 'days').toISOString(),
  moment().add(12, 'days').toISOString(),
];

export function clamp(value, a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);

  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }
  return value;
}
