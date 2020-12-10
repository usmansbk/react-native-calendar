import moment from 'moment';

export function getDate() {
  return moment();
}

export function formatMonthHeader(date) {
  return moment(date).format('MMMM YYYY');
}
