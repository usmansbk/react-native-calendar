import React, {useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {getDate, formatMonthHeader, generateMonthMatrix} from './utils';

const BUTTON_SIZE = 48;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const colors = {
  black: '#313131',
  gray: '#9A9A9A',
};

export default function Calendar() {
  const [date] = useState(getDate());
  const rows = generateMonthMatrix(date);
  return (
    <View style={[styles.container]}>
      <MonthHeader title={formatMonthHeader(date)} />
      <WeekHeader />
      <Rows rows={rows} />
      <Footer />
    </View>
  );
}

function Rows({rows = []}) {
  return rows.map((row, index) => <Row key={index} row={row} />);
}

function Row({row = []}) {
  return (
    <View style={[styles.row]}>
      {row.map((day, index) => (
        <Day key={index} day={day} />
      ))}
    </View>
  );
}

function Day({day}) {
  return (
    <TouchableOpacity style={[styles.day]}>
      <Text style={[day.isSameMonth ? styles.sameMonth : styles.dayText]}>
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
    backgroundColor: 'white',
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
  },
  dayText: {
    color: colors.gray,
  },
  sameMonth: {
    color: colors.black,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
