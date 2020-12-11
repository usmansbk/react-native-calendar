import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
  Image,
  ScrollView,
} from 'react-native';
import {
  getDate,
  getMonth,
  getDateRow,
  getNextMonth,
  getPreviousMonth,
  formatMonthHeader,
  generateMonthMatrix,
  mockMarkedDates,
  isMarked,
  isSameDay,
  isToday,
  isSameMonth,
} from './utils';
import {
  colors,
  CALENDAR_HEIGHT,
  DAYS_OF_WEEK,
  BUTTON_SIZE,
  ROW_HEIGHT,
  FOOTER_HEIGHT,
} from './constants';

const MINIMUM_SWIPE_DOWN = ROW_HEIGHT;
const MINIMUM_SWIPE_DOWN_VELOCITY = 0.3;

export default function SimpleCalendar({
  markedDates = mockMarkedDates,
  date = getDate(),
  onDateChange = () => null,
}) {
  const [_date, setDate] = useState(date);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentMonthRows = useMemo(() => generateMonthMatrix(_date), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    getMonth(_date),
  ]);

  const months = [currentMonthRows];
  const dateRow = useMemo(() => getDateRow(_date), [_date]);
  const onPressDay = useCallback(
    (day) => {
      requestAnimationFrame(() => {
        setDate(day);
        onDateChange?.(day);
      });
    },
    [onDateChange],
  );

  return (
    <Calendar
      months={months}
      onPressDay={onPressDay}
      markedDates={markedDates}
      date={_date}
      dateRow={dateRow}
    />
  );
}

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.onPressDay = props.onPressDay;
  }

  animation = new Animated.ValueXY();
  panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // using extractOffset doesn't work as expected
      this.animation.setOffset({
        x: this.animation.x._value,
        y: this.animation.y._value,
      });
    },
    onPanResponderMove: (_, {dy, dx}) => {
      this.animation.setValue({
        x: dx,
        y: dy,
      });
    },
    onPanResponderRelease: (_, {dx, dy, vy}) => {
      if (dy > 0) {
        // swipe down

        if (
          Math.abs(dy) > MINIMUM_SWIPE_DOWN ||
          vy > MINIMUM_SWIPE_DOWN_VELOCITY
        ) {
          // second row is now visible or swipe down fast
          Animated.timing(this.animation.y, {
            toValue: CALENDAR_HEIGHT,
            duration: 300,
            useNativeDriver: false,
          }).start(() => this.animation.flattenOffset());
        } else {
          Animated.timing(this.animation.y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start(() => this.animation.flattenOffset());
        }
      } else {
        // swipe up
        Animated.timing(this.animation.y, {
          toValue: -CALENDAR_HEIGHT,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          this.animation.flattenOffset();
        });
      }
    },
  });

  render() {
    const {markedDates = [], date, dateRow, months} = this.props;
    return (
      <View style={[styles.container]}>
        <MonthHeader title={formatMonthHeader(date)} />
        <WeekHeader />
        <Animated.View
          {...this.panResponder.panHandlers}
          style={
            (styles.rows,
            [
              {
                height: this.animation.y.interpolate({
                  inputRange: [0, CALENDAR_HEIGHT],
                  outputRange: [ROW_HEIGHT + FOOTER_HEIGHT, CALENDAR_HEIGHT],
                  extrapolate: 'clamp',
                }),
              },
            ])
          }>
          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}>
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: this.animation.y.interpolate({
                      inputRange: [0, CALENDAR_HEIGHT],
                      outputRange: [-ROW_HEIGHT * dateRow, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}>
              {months.map((rows, index) => {
                return (
                  <Animated.View style={[styles.months]}>
                    <Rows
                      key={index}
                      rows={rows}
                      date={date}
                      onPressDay={this.onPressDay}
                      markedDates={markedDates}
                    />
                  </Animated.View>
                );
              })}
            </Animated.View>
          </ScrollView>
          <View style={[styles.footer]}>
            <Animated.View
              style={[
                {
                  transform: [
                    {
                      rotateX: this.animation.y.interpolate({
                        inputRange: [0, CALENDAR_HEIGHT],
                        outputRange: ['180deg', '0deg'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}>
              <Image source={require('./img/arrow.png')} style={styles.arrow} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    );
  }
}

function Rows({rows = [], date, markedDates, onPressDay}) {
  return (
    <View style={styles.month}>
      {rows.map((row, index) => (
        <Row
          date={date}
          key={index}
          row={row}
          onPressDay={onPressDay}
          markedDates={markedDates}
        />
      ))}
    </View>
  );
}

function Row({row = [], onPressDay, markedDates = [], date}) {
  return (
    <View style={[styles.row]}>
      {row.map((day, index) => (
        <Day
          date={date}
          key={index}
          day={day}
          onPressDay={onPressDay}
          marked={isMarked(markedDates, day.isoString)}
        />
      ))}
    </View>
  );
}

function Day({day, onPressDay, marked, date}) {
  const onPress = useCallback(() => onPressDay(day.isoString), [
    day.isoString,
    onPressDay,
  ]);
  const sameDay = isSameDay(day.isoString, date);
  const today = isToday(day.isoString);
  const thisMonth = isSameMonth(day.isoString, date);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.day,
        sameDay ? (today ? styles.today : styles.selected) : undefined,
      ]}>
      <Text
        style={[
          thisMonth ? styles.sameMonth : styles.dayText,
          today
            ? sameDay
              ? styles.todayText
              : styles.todayTextBlur
            : undefined,
        ]}>
        {day.date}
      </Text>
      {marked && <Dot contrast={today && sameDay} />}
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
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: FOOTER_HEIGHT,
    backgroundColor: colors.white, // PanResponder doesn't work without background color set for View
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
  months: {
    flexDirection: 'row',
    flex: 1,
  },
  month: {
    flex: 1,
  },
});
