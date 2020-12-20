import React, {useCallback, useContext, useMemo} from 'react';
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
  getDateMonth,
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
const HORIZONTAL_PADDING = 8;
const CALENDAR_WIDTH = width - HORIZONTAL_PADDING;
const MINIMUM_DRAG = CALENDAR_WIDTH * 0.4;
const MINIMUM_HORIZONTAL_SWIPE = 0.5;

export default function SimpleCalendar({
  markedDates = mockMarkedDates,
  startDate = getDate(),
  onDateChange = () => null,
  styles = {},
  colors = COLORS,
  dayTitleFormat = DAY_FORMAT,
}) {
  const DAYS_OF_WEEK = useMemo(() => getDaysOfWeek(dayTitleFormat), [
    dayTitleFormat,
  ]);
  const computedStyles = useMemo(
    () => Object.assign({}, makeStyles(colors), styles),
    [styles, colors],
  );

  const onDateSelected = useCallback(
    (day) => {
      requestAnimationFrame(() => {
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
        date={startDate}
        styles={computedStyles}
        daysOfWeek={DAYS_OF_WEEK}
      />
    </ThemeContext.Provider>
  );
}

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIndex: 1,
      startDate: props.date,
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
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dy: this.scrollY,
        },
      ],
      {useNativeDriver: false},
    ),
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
  swipePanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      this.scrollX.extractOffset();
    },
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dx: this.scrollX,
        },
      ],
      {useNativeDriver: false},
    ),
    onPanResponderRelease: (_, {dx, vx}) => {
      if (
        Math.abs(dx) > MINIMUM_DRAG ||
        Math.abs(vx) > MINIMUM_HORIZONTAL_SWIPE
      ) {
        Animated.timing(this.scrollX, {
          toValue: dx < 0 ? -CALENDAR_WIDTH : CALENDAR_WIDTH,
          duration: 300,
          useNativeDriver: false,
        }).start(({finished}) => {
          if (finished) {
            if (dx > 0) {
              this.setState(
                (state) => {
                  const date = state.months[0].date;
                  return {
                    date: getDateMonth(state.date, date),
                    months: [
                      generateMonthMatrix(getPreviousMonth(date)),
                      ...state.months.slice(0, 2),
                    ],
                  };
                },
                () => this.scrollX.setValue(0),
              );
            } else if (dx < 0) {
              this.setState(
                (state) => {
                  const date = state.months[2].date;
                  return {
                    date: getDateMonth(state.date, date),
                    months: [
                      ...state.months.slice(1),
                      generateMonthMatrix(getNextMonth(date)),
                    ],
                  };
                },
                () => this.scrollX.setValue(0),
              );
            }
          }
        });
      } else {
        Animated.timing(this.scrollX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  _resetMonth = () => {
    const date = this.props.date;
    this.setState({
      date,
      months: [
        generateMonthMatrix(getPreviousMonth(date)),
        generateMonthMatrix(date),
        generateMonthMatrix(getNextMonth(date)),
      ],
    });
  };

  static getDerivedStateFromProps(props, state) {
    if (props.date !== state.startDate) {
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

  onDateSelected = (date) => {
    requestAnimationFrame(() => {
      this.setState((state) => {
        return {
          date,
        };
      });
    });
  };

  render() {
    const {markedDates = [], styles, daysOfWeek} = this.props;
    const {date} = this.state;
    return (
      <View style={styles.container}>
        <MonthHeader
          months={this.state.months}
          animation={this.scrollX}
          resetMonth={this._resetMonth}
        />
        <WeekHeader names={daysOfWeek} />
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.contentContainerStyle}
          style={{
            height: this.scrollY.interpolate({
              inputRange: [0, CALENDAR_HEIGHT],
              outputRange: [ROW_HEIGHT, CALENDAR_HEIGHT],
              extrapolate: 'clamp',
            }),
          }}>
          <Animated.View
            style={[
              styles.months,
              {
                transform: [
                  {
                    translateY: this.scrollY.interpolate({
                      inputRange: [0, CALENDAR_HEIGHT],
                      outputRange: [-ROW_HEIGHT * getDateRow(date), 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}>
            {this.state.months.map((month, index) => {
              let panHandlers =
                index === 1 ? this.swipePanResponder.panHandlers : {};
              return (
                <Animated.View
                  key={index}
                  {...panHandlers}
                  style={[
                    styles.month,
                    {
                      left: (index - 1) * CALENDAR_WIDTH,
                      transform: [
                        {
                          translateX: this.scrollX.interpolate({
                            inputRange: [-CALENDAR_WIDTH, CALENDAR_WIDTH],
                            outputRange: [-CALENDAR_WIDTH, CALENDAR_WIDTH],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Rows
                    date={date}
                    rows={month.rows}
                    onDateSelected={this.onDateSelected}
                    markedDates={index === 1 ? markedDates : []}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
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

function MonthHeader({months, animation = new Animated.Value(), resetMonth}) {
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
      {names.map((name) => (
        <Animated.Text
          key={name}
          onPress={resetMonth}
          style={[
            styles.monthHeaderText,
            {
              transform: [
                {
                  translateX: animation.interpolate({
                    inputRange: [-CALENDAR_WIDTH, CALENDAR_WIDTH],
                    outputRange: [-CALENDAR_WIDTH, CALENDAR_WIDTH],
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
      padding: HORIZONTAL_PADDING / 2,
    },
    contentContainerStyle: {
      flexGrow: 1,
    },
    monthHeaderContainer: {
      width: CALENDAR_WIDTH,
      flexGrow: 1,
    },
    monthHeaderScrollView: {
      height: 40,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthHeaderText: {
      paddingVertical: 8,
      textTransform: 'uppercase',
      color: colors.black,
      textAlign: 'center',
      fontWeight: 'bold',
      width: CALENDAR_WIDTH,
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
      flex: 1,
      flexDirection: 'row',
    },
    month: {
      position: 'absolute',
      top: 0,
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
