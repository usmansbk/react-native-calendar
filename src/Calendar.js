import React, {useCallback, useMemo, useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {
  getDate,
  formatMonthHeader,
  generateMonthMatrix,
  NUMBER_OF_ROWS,
  mockMarkedDates,
  isMarked,
} from './utils';

const BUTTON_SIZE = 48;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const colors = {
  black: '#313131',
  gray: '#9A9A9A',
  backgroundColor: 'white',
  primary: '#3498db',
  lightGray: '#ecf0f1',
  white: 'white',
};
const ROW_HEIGHT = BUTTON_SIZE + 4; // 4 is the sum of top and bottom margin
const CALENDAR_HEIGHT = ROW_HEIGHT * NUMBER_OF_ROWS;

export default function Calendar({markedDates = mockMarkedDates}) {
  const [date, setDate] = useState(getDate());
  const rows = useMemo(() => generateMonthMatrix(date), [date]);
  const onPressDay = useCallback((day) => {
    requestAnimationFrame(() => {
      setDate(day);
    });
  }, []);

  return (
    <View style={[styles.container]}>
      <MonthHeader title={formatMonthHeader(date)} />
      <WeekHeader />
      <Rows rows={rows} onPressDay={onPressDay} markedDates={markedDates} />
      <Footer />
    </View>
  );
}

function Rows({rows = [], onPressDay, markedDates = []}) {
  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      style={[styles.rows]}>
      {rows.map((row, index) => (
        <Row
          key={index}
          row={row}
          onPressDay={onPressDay}
          markedDates={markedDates}
        />
      ))}
    </Animated.ScrollView>
  );
}

function Row({row = [], onPressDay, markedDates = []}) {
  console.log(markedDates);
  return (
    <View style={[styles.row]}>
      {row.map((day, index) => (
        <Day
          key={index}
          day={day}
          onPressDay={onPressDay}
          marked={isMarked(markedDates, day.isoString)}
        />
      ))}
    </View>
  );
}

function Day({day, onPressDay, marked}) {
  const onPress = useCallback(() => onPressDay(day.isoString), [
    day.isoString,
    onPressDay,
  ]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.day,
        day.isSelected
          ? day.isToday
            ? styles.today
            : styles.selected
          : undefined,
      ]}>
      <Text
        style={[
          day.isSameMonth ? styles.sameMonth : styles.dayText,
          day.isToday
            ? day.isSelected
              ? styles.todayText
              : styles.todayTextBlur
            : undefined,
        ]}>
        {day.date}
      </Text>
      {marked && <Dot contrast={day.isToday && day.isSelected} />}
    </TouchableOpacity>
  );
}

function WeekHeader({names = DAYS_OF_WEEK}) {
  return (
    <View style={[styles.weekHeader]}>
      {names.map((name, index) => (
        <View key={index} style={[styles.weekday]}>
          <Text style={[styles.weekHeaderText]}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function MonthHeader({title}) {
  return (
    <View style={[styles.monthHeader]}>
      <Text style={[styles.monthHeaderText]}>{title}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={[styles.footer]}>
      <Animated.Image
        source={require('./img/arrow.png')}
        style={[styles.arrow]}
      />
    </View>
  );
}

function Dot({contrast}) {
  return (
    <View style={[styles.dot, contrast ? styles.contrastDot : undefined]} />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundColor,
    padding: 4,
  },
  monthHeader: {
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeaderText: {
    textTransform: 'uppercase',
    color: colors.black,
    fontWeight: 'bold',
  },
  arrow: {
    width: 14,
    height: 14,
    transform: [{rotateX: '180deg'}],
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekHeaderText: {
    color: colors.gray,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  weekday: {
    width: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  day: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    color: colors.gray,
  },
  sameMonth: {
    color: colors.black,
  },
  today: {
    backgroundColor: colors.primary,
  },
  selected: {
    backgroundColor: colors.lightGray,
  },
  todayText: {
    color: colors.white,
  },
  todayTextBlur: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rows: {
    height: CALENDAR_HEIGHT,
  },
  dot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.gray,
    position: 'absolute',
    bottom: 10,
  },
  contrastDot: {
    backgroundColor: colors.white,
  },
});
