import React, {useCallback, useContext, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  getDate,
  getMonth,
  getDateRow,
  getDaysOfWeek,
  generateMonthMatrix,
  mockMarkedDates,
  isMarked,
  isSameDay,
  isToday,
  getPreviousMonth,
  getNextMonth,
} from './utils';
import {
  COLORS,
  CALENDAR_HEIGHT,
  BUTTON_SIZE,
  ROW_HEIGHT,
  FOOTER_HEIGHT,
  DAY_FORMAT,
} from './constants';

const MINIMUM_SWIPE_DOWN = ROW_HEIGHT;
const MINIMUM_SWIPE_DOWN_VELOCITY = 0.3;
const {width} = Dimensions.get('window');

export default function SimpleCalendar({
  markedDates = mockMarkedDates,
  startDate = getDate(),
  onDateChange = () => null,
  styles = {},
  colors = COLORS,
  dayTitleFormat = DAY_FORMAT,
}) {
  const [date, setDate] = useState(startDate);
  const DAYS_OF_WEEK = useMemo(() => getDaysOfWeek(dayTitleFormat), [
    dayTitleFormat,
  ]);
  const computedStyles = useMemo(
    () => Object.assign({}, makeStyles(colors), styles),
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
    this.state = {
      date: props.date,
      months: [
        generateMonthMatrix(getPreviousMonth(props.date)),
        generateMonthMatrix(props.date),
        generateMonthMatrix(getNextMonth(props.date)),
      ],
    };
  }

  scrollY = new Animated.Value(0);
  scrollX = new Animated.Value(0);
  panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      this.scrollY.extractOffset();
    },
    onPanResponderMove: (_, {dy}) => {
      this.scrollY.setValue(dy);
    },
    onPanResponderRelease: (_, {dy, vy}) => {
      if (dy > 0) {
        // swipe down

        if (
          Math.abs(dy) > MINIMUM_SWIPE_DOWN ||
          vy > MINIMUM_SWIPE_DOWN_VELOCITY
        ) {
          // second row is now visible or swipe down fast
          Animated.timing(this.scrollY, {
            toValue: CALENDAR_HEIGHT,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(this.scrollY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      } else {
        // swipe up
        Animated.timing(this.scrollY, {
          toValue: -CALENDAR_HEIGHT,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  static getDerivedStateFromProps(props, state) {
    if (props.date !== state.date) {
      return {
        date: props.date,
        months: [
          generateMonthMatrix(getPreviousMonth(props.date)),
          generateMonthMatrix(props.date),
          generateMonthMatrix(getNextMonth(props.date)),
        ],
      };
    }
    return null;
  }

  render() {
    const {
      markedDates = [],
      date,
      dateRowIndex,
      styles,
      daysOfWeek,
    } = this.props;
    return (
      <View style={styles.container}>
        <MonthHeader months={this.state.months} animation={this.scrollX} />
        <WeekHeader names={daysOfWeek} />
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={{
            height: this.scrollY.interpolate({
              inputRange: [0, CALENDAR_HEIGHT],
              outputRange: [ROW_HEIGHT, CALENDAR_HEIGHT],
              extrapolate: 'clamp',
            }),
          }}>
          <Animated.ScrollView
            horizontal
            bounces={false}
            snapToInterval={width - 8}
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.months}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      x: this.scrollX,
                    },
                  },
                },
              ],
              {useNativeDriver: false},
            )}
            style={[
              {
                transform: [
                  {
                    translateY: this.scrollY.interpolate({
                      inputRange: [0, CALENDAR_HEIGHT],
                      outputRange: [-ROW_HEIGHT * dateRowIndex, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}>
            {this.state.months.map((month, index) => {
              return (
                <Rows
                  key={index}
                  date={date}
                  rows={month.rows}
                  onDateSelected={this.onDateSelected}
                  markedDates={markedDates}
                />
              );
            })}
          </Animated.ScrollView>
        </Animated.ScrollView>
        <Animated.View style={styles.footer} {...this.panResponder.panHandlers}>
          <Knob animation={this.scrollY} />
        </Animated.View>
      </View>
    );
  }
}

function Rows({rows = [], date, markedDates, onDateSelected}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={styles.rows}>
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
  const isInMonth = day.isInMonth;

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

function MonthHeader({months, animation = new Animated.Value()}) {
  const styles = useContext(ThemeContext);
  const names = months.map((month) => month.name);
  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      snapToInterval={width}
      pagingEnabled
      style={styles.monthHeaderContainer}
      contentContainerStyle={styles.monthHeaderScrollView}>
      {names.map((name, index) => (
        <Animated.Text
          key={name}
          style={[
            styles.monthHeaderText,
            {
              opacity: animation.interpolate({
                inputRange: [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
                ],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateX: animation.interpolate({
                    inputRange: [
                      (index - 1) * width,
                      index * width,
                      (index + 1) * width,
                    ],
                    outputRange: [
                      (index - 1) * -width,
                      index * -width,
                      (index + 1) * -width,
                    ],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}>
          {name}
        </Animated.Text>
      ))}
    </Animated.ScrollView>
  );
}

function Dot({contrast}) {
  const styles = useContext(ThemeContext);
  return (
    <View style={[styles.dot, contrast ? styles.contrastDot : undefined]} />
  );
}

function Knob({size = 20, animation}) {
  const styles = useContext(ThemeContext);
  return (
    <Animated.View
      style={[
        styles.knob,
        {
          width: animation.interpolate({
            inputRange: [0, CALENDAR_HEIGHT],
            outputRange: [size, size * 2],
            extrapolate: 'clamp',
          }),
        },
      ]}
    />
  );
}

const makeStyles = (colors = COLORS) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundColor,
      padding: 4,
    },
    monthHeaderContainer: {
      width: width - 8,
      flexGrow: 1,
    },
    monthHeaderScrollView: {
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthHeaderText: {
      paddingVertical: 8,
      textTransform: 'uppercase',
      color: colors.black,
      textAlign: 'center',
      fontWeight: 'bold',
      width: width - 8,
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
      width: width - 8, // 8 is the total horizontal padding on the container
      justifyContent: 'center',
    },
    months: {
      flexGrow: 1,
    },
    dot: {
      height: 4,
      width: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      position: 'absolute',
      bottom: 10,
    },
    contrastDot: {
      backgroundColor: colors.white,
    },
    knob: {
      backgroundColor: colors.knob,
      height: 4,
      borderRadius: 2,
    },
  });

const ThemeContext = React.createContext(makeStyles(COLORS));
