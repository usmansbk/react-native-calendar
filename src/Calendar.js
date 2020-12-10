import React, {useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {getDate, formatMonthHeader} from './utils';

const BUTTON_SIZE = 48;
const DEFAULT_SHORT_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const [date] = useState(getDate());
  return (
    <View style={[styles.container]}>
      <MonthHeader title={formatMonthHeader(date)} />
      <WeekHeader />
      <Footer />
    </View>
  );
}

function WeekHeader({shortNames = DEFAULT_SHORT_NAMES}) {
  return (
    <View style={[styles.weekHeader]}>
      {shortNames.map((name, index) => (
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
    color: '#313131',
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
    color: '#9A9A9A',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  weekday: {
    width: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
