import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

/**
 * Props:
 * - selectedDate: Date object of currently selected date
 * - onSelect: function(date) called when a date is selected
 * - minDate: Date object (optional) - minimum selectable date (past dates can be disabled)
 * - getStatus(date): function(date) returning 'available' | 'fully-booked' | 'closed' | null
 * - legendCount: number (optional) - count of available days for the "X open days this month" label
 *
 * For clinic: getStatus should return 'available', 'fully-booked', or 'closed'
 * For court: getStatus can return null (no markers shown)
 */
export default function MonthCalendar({ selectedDate, onSelect, minDate, getStatus, legendCount }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => {
    const initialDate = selectedDate || today;
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

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
            className='h-8 w-8 items-center justify-center rounded-xl bg-[#f3f7fc] border border-[#dce8f5] active:bg-[#e7f0fa]'
          >
            <Text className='text-base font-bold text-[#173b70]'>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Next Month'
            onPress={nextMonth}
            className='h-8 w-8 items-center justify-center rounded-xl bg-[#f3f7fc] border border-[#dce8f5] active:bg-[#e7f0fa]'
          >
            <Text className='text-base font-bold text-[#173b70]'>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Days Horizontal Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName='pb-1'>
        {daysInMonth.map((x, i) => {
          const selected = x.toDateString() === selectedDate?.toDateString();
          const past = isPast(x);
          const availability = dateAvailability?.[i];
          const isAvailable = availability === 'available';
          const isFullyBooked = availability === 'fully-booked';

          let containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3';
          let textClass = 'text-xs font-medium';
          let dayTextClass = 'my-1 text-xl font-bold';

          if (past) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#f1f3f6] border-[#e8edf3] opacity-50';
            textClass = 'text-xs font-medium text-[#98a4b4]';
            dayTextClass = 'my-1 text-xl font-bold text-[#98a4b4]';
          } else if (isFullyBooked) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#f1f3f6] border-[#e8edf3]';
            textClass = 'text-xs font-medium text-[#98a4b4]';
            dayTextClass = 'my-1 text-xl font-bold text-[#98a4b4]';
          } else if (selected) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 border-[#173b70] bg-[#173b70]';
            textClass = 'text-xs font-medium text-blue-100';
            dayTextClass = 'my-1 text-xl font-bold text-white';
          } else if (isAvailable) {
            containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#e7f6ed] border-[#e6f2e8]';
            textClass = 'text-xs font-medium text-[#287a4b]';
            dayTextClass = 'my-1 text-xl font-bold text-[#287a4b]';
          }

          return (
            <View key={x.toDateString()} className='relative'>
              <Pressable
                accessibilityRole='button'
                accessibilityState={{ selected, disabled: past }}
                disabled={past}
                accessibilityLabel={x.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                onPress={() => {
                  if (past) return; // Prevent selecting past dates
                  onSelect?.(x);
                }}
                className={containerClass}
              >
                <Text className={textClass}>{x.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                <Text className={dayTextClass}>{x.getDate()}</Text>
                <Text className={`text-[10px] ${selected ? 'text-blue-100' : 'text-muted'}`}>{x.toLocaleDateString('en-US', { month: 'short' })}</Text>
              </Pressable>
              {availability === 'available' && !selected && !past && (
                <View className='absolute -top-1 -right-1 rounded-full bg-[#287a4b] px-1.5 py-0.5'>
                  <Text className='text-[10px] font-bold text-white'>Nurse Available</Text>
                </View>
              )}
              {availability === 'fully-booked' && !selected && !past && (
                <View className='absolute -top-1 -right-1 rounded-full bg-[#98a4b4] px-1.5 py-0.5'>
                  <Text className='text-[10px] font-bold text-white'>Fully Booked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      {legendCount !== undefined && (
        <View className='mt-3 rounded-lg bg-[#f8fafd] p-3'>
          <Text className='text-xs font-medium text-muted'>Availability Status</Text>
          <View className='mt-2 flex-row items-center justify-between rounded-lg border border-[#dce6f2] bg-white px-3 py-2'>
            <View className='flex-row items-center gap-2'>
              <View className='h-2 w-2 rounded-full bg-[#287a4b]' />
              <Text className='text-sm text-ink'>Nurse Available</Text>
            </View>
            <Text className='text-xs text-muted'>{legendCount} open days this month</Text>
          </View>
        </View>
      )}
    </View>
  );
}