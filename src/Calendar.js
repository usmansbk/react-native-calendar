import React, {useCallback, useContext, useMemo, useState} from 'react';
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
  getDaysOfWeek,
  formatMonthHeader,
  generateMonthMatrix,
  mockMarkedDates,
  isMarked,
  isSameDay,
  isToday,
  isSameMonth,
} from './utils';
import {
  COLORS,
  CALENDAR_HEIGHT,
  BUTTON_SIZE,
  ROW_HEIGHT,
  FOOTER_HEIGHT,
} from './constants';

const MINIMUM_SWIPE_DOWN = ROW_HEIGHT;
const MINIMUM_SWIPE_DOWN_VELOCITY = 0.3;

export default function SimpleCalendar({
  markedDates = mockMarkedDates,
  startDate = getDate(),
  onDateChange = () => null,
  styles = {},
  colors = COLORS,
}) {
  const [date, setDate] = useState(startDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => generateMonthMatrix(date), [getMonth(date)]);
  const DAYS_OF_WEEK = useMemo(() => getDaysOfWeek(), []);
  const computedStyles = useMemo(
    () => Object.assign({}, defaultStyles(colors), styles),
    [styles, colors],
  );

  const dateRowIndex = useMemo(() => getDateRow(date), [date]);

  const onDateSelected = useCallback(
    (day) => {
      requestAnimationFrame(() => {
        setDate(day);
        onDateChange?.(day);
      });
    },
    [onDateChange],
  );

  return (
    <ThemeContext.Provider value={computedStyles}>
      <Calendar
        rows={rows}
        onDateSelected={onDateSelected}
        markedDates={markedDates}
        date={date}
        dateRowIndex={dateRowIndex}
        styles={computedStyles}
        daysOfWeek={DAYS_OF_WEEK}
      />
    </ThemeContext.Provider>
  );
}

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.onDateSelected = props.onDateSelected;
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
    const {
      markedDates = [],
      date,
      dateRowIndex,
      rows,
      styles,
      daysOfWeek,
    } = this.props;
    return (
      <View style={styles.container}>
        <MonthHeader title={formatMonthHeader(date)} />
        <WeekHeader names={daysOfWeek} />
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
              style={[
                styles.calendarRow,
                {
                  transform: [
                    {
                      translateY: this.animation.y.interpolate({
                        inputRange: [0, CALENDAR_HEIGHT],
                        outputRange: [-ROW_HEIGHT * dateRowIndex, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}>
              <Animated.View style={[styles.left]} />
              <Animated.View style={styles.months}>
                <Rows
                  rows={rows}
                  date={date}
                  onDateSelected={this.onDateSelected}
                  markedDates={markedDates}
                />
              </Animated.View>
              <Animated.View style={styles.right} />
            </Animated.View>
          </ScrollView>
          <View style={styles.footer}>
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

function Rows({rows = [], date, markedDates, onDateSelected}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={styles.month}>
      {rows.map((row, index) => (
        <Row
          date={date}
          key={index}
          row={row}
          onDateSelected={onDateSelected}
          markedDates={markedDates}
        />
      ))}
    </View>
  );
}

function Row({row = [], onDateSelected, markedDates = [], date}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={styles.row}>
      {row.map((day, index) => (
        <Day
          date={date}
          key={index}
          day={day}
          onPress={onDateSelected}
          marked={isMarked(markedDates, day.isoString)}
        />
      ))}
    </View>
  );
}

function Day({day, onPress, marked, date}) {
  const styles = useContext(ThemeContext);
  const _onPress = useCallback(() => onPress(day.isoString), [
    day.isoString,
    onPress,
  ]);
  const isSelected = isSameDay(day.isoString, date);
  const isTodaysDate = isToday(day.isoString);
  const isInMonth = isSameMonth(day.isoString, date);

  return (
    <TouchableOpacity
      onPress={_onPress}
      style={[
        styles.day,
        isSelected
          ? isTodaysDate
            ? styles.today
            : styles.selected
          : undefined,
      ]}>
      <Text
        style={[
          isInMonth ? styles.sameMonth : styles.dayText,
          isTodaysDate
            ? isSelected
              ? styles.todayText
              : styles.todayTextBlur
            : undefined,
        ]}>
        {day.date}
      </Text>
      {marked && <Dot contrast={isTodaysDate && isSelected} />}
    </TouchableOpacity>
  );
}

function WeekHeader({names}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={styles.weekHeader}>
      {names.map((name, index) => (
        <View key={index} style={styles.weekday}>
          <Text style={styles.weekHeaderText}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function MonthHeader({title}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={styles.monthHeader}>
      <Text style={styles.monthHeaderText}>{title}</Text>
    </View>
  );
}

function Dot({contrast}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={[styles.dot, contrast ? styles.contrastDot : undefined]} />
  );
}

const defaultStyles = (colors) =>
  StyleSheet.create({
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
    calendarRow: {},
  });

const ThemeContext = React.createContext(defaultStyles(COLORS));
