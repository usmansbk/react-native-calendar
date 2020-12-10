import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {getDate, formatMonthHeader, generateMonthMatrix} from './utils';

const BUTTON_SIZE = 48;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const colors = {
  black: '#313131',
  gray: '#9A9A9A',
  backgroundColor: 'white',
};

export default function Calendar() {
  const [date, setDate] = useState(getDate());
  const rows = generateMonthMatrix(date);
  const onPressDay = (day) => {
    requestAnimationFrame(() => {
      setDate(day);
    });
  };

  return (
    <View style={[styles.container]}>
      <MonthHeader title={formatMonthHeader(date)} />
      <WeekHeader />
      <Rows rows={rows} onPressDay={onPressDay} />
      <Footer />
    </View>
  );
}

function Rows({rows = [], onPressDay}) {
  return rows.map((row, index) => (
    <Row key={index} row={row} onPressDay={onPressDay} />
  ));
}

function Row({row = [], onPressDay}) {
  return (
    <View style={[styles.row]}>
      {row.map((day, index) => (
        <Day key={index} day={day} onPressDay={onPressDay} />
      ))}
    </View>
  );
}

function Day({day, onPressDay}) {
  const onPress = useCallback(() => onPressDay(day.moment), [
    day.moment,
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
    paddingTop: 8,
    paddingBottom: 4,
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
    backgroundColor: 'tomato',
  },
  selected: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
  todayText: {
    color: 'white',
  },
  todayTextBlur: {
    color: 'tomato',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
