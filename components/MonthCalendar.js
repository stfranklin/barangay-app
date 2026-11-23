import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

/**
 * Props:
 * - selectedDate: Date object of currently selected date
 * - onSelect: function(date) called when a date is selected
 * - onMonthChange: function(firstDayOfMonth) called on mount and when prev/next month is pressed
 * - minDate: Date object (optional) - minimum selectable date (past dates can be disabled)
 * - getStatus(date): function(date) returning 'available' | 'fully-booked' | 'closed' | null
 * - legendCount: number (optional) - count of available days for the "X open days this month" label
 *
 * For clinic: getStatus should return 'available', 'fully-booked', or 'closed'
 * For court: getStatus can return null (no markers shown)
 */
export default function MonthCalendar({ selectedDate, onSelect, onMonthChange, minDate, getStatus, legendCount }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => {
    const initialDate = selectedDate || today;
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  // Notify parent of month changes (on mount and when navigating)
  useEffect(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    onMonthChange?.(firstDayOfMonth);
  }, [onMonthChange, currentDate]);

  // Month & Year details
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let day = 1; day <= totalDays; day++) {
      result.push(new Date(year, month, day));
    }
    return result;
  }, [currentYear, currentMonth]);

  // Navigate to previous month
  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  // Navigate to next month
  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Check if a given date is in the past
  const isPast = useCallback((d) => {
    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }, [today]);

  // Check if date is closed (weekend or explicitly closed)
  const isClosed = useCallback((d) => {
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, []);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate availability status for each date in the month
  const dateAvailability = useMemo(() => {
    return daysInMonth.map((x) => {
      const status = getStatus?.(x);
      return status;
    });
  }, [daysInMonth, getStatus]);

  return (
    <View>
      {/* Month Navigation Controls */}
      <View className='mb-3 flex-row items-center justify-between'>
        <View>
          <Text className='font-bold text-ink'>Choose a date</Text>
          <Text className='mt-0.5 text-xs text-muted'>{monthYearLabel}</Text>
        </View>
        <View className='flex-row items-center gap-1'>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Previous Month'
            onPress={prevMonth}
            className='h-8 w-8 items-center justify-center rounded-xl bg-availableLight border border-line active:bg-card'
          >
            <Text className='text-base font-bold text-ink'>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Next Month'
            onPress={nextMonth}
            className='h-8 w-8 items-center justify-center rounded-xl bg-availableLight border border-line active:bg-card'
          >
            <Text className='text-base font-bold text-ink'>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Days Horizontal Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName='pb-1'>
        {daysInMonth.map((x, i) => {
          const selected = x.toDateString() === selectedDate?.toDateString();
          const past = isPast(x);
          const closed = isClosed(x);
          const availability = dateAvailability?.[i];
          const isAvailable = availability === 'available';
          const isFullyBooked = availability === 'fully-booked';

          // Days are disabled if past, closed (weekend), or fully-booked
          const disabled = past || closed || isFullyBooked;

          // Base container class
          let containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3';
          let textClass = 'text-xs font-medium';
          let dayTextClass = 'my-1 text-xl font-bold';

          if (disabled) {
            // Use unavailableLight (availableLight is for available, unavailable for unavailable/disabled)
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-unavailableLight border-[#e8edf3] opacity-50';
            textClass = 'text-xs font-medium text-unavailable';
            dayTextClass = 'my-1 text-xl font-bold text-unavailable';
          } else if (selected) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 border-[#173b70] bg-[#173b70]';
            textClass = 'text-xs font-medium text-blue-100';
            dayTextClass = 'my-1 text-xl font-bold text-white';
          } else if (isAvailable) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-availableLight border-[#e6f2e8]';
            textClass = 'text-xs font-medium text-available';
            dayTextClass = 'my-1 text-xl font-bold text-available';
          }

          // Determine label for disabled days
          const disabledLabel = closed ? 'Closed' : (isFullyBooked ? 'Fully Booked' : null);

          return (
            <View key={x.toDateString()} className='relative'>
              <Pressable
                accessibilityRole='button'
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                accessibilityLabel={x.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                onPress={() => {
                  if (disabled) return;
                  onSelect?.(x);
                }}
                className={containerClass}
              >
                <Text className={textClass}>{x.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                <Text className={dayTextClass}>{x.getDate()}</Text>
                <Text className={`text-[10px] ${selected ? 'text-blue-100' : 'text-muted'}`}>{x.toLocaleDateString('en-US', { month: 'short' })}</Text>
                {disabledLabel && (
                  <Text className='absolute -bottom-6 left-0 right-0 text-center text-[10px] font-medium text-unavailable'>{disabledLabel}</Text>
                )}
              </Pressable>
              {availability === 'available' && !selected && !disabled && (
                <View className='absolute -top-1 -right-1 rounded-full bg-available px-1.5 py-0.5'>
                  <Text className='text-[10px] font-bold text-white'>Nurse Available</Text>
                </View>
              )}
              {availability === 'fully-booked' && !selected && !disabled && (
                <View className='absolute -top-1 -right-1 rounded-full bg-unavailable px-1.5 py-0.5'>
                  <Text className='text-[10px] font-bold text-white'>Fully Booked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      {legendCount !== undefined && (
        <View className='mt-3 rounded-lg bg-card p-3'>
          <Text className='text-xs font-medium text-muted'>Availability Status</Text>
          <View className='mt-2 flex-row items-center justify-between rounded-lg border border-line bg-white px-3 py-2'>
            <View className='flex-row items-center gap-2'>
              <View className='h-2 w-2 rounded-full bg-available' />
              <Text className='text-sm text-ink'>Nurse Available</Text>
            </View>
            <Text className='text-xs text-muted'>{legendCount} open days this month</Text>
          </View>
        </View>
      )}
    </View>
  );
}