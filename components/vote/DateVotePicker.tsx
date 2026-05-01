'use client'

import { useState } from 'react'
import { getDatesInRange } from '@/lib/date/optimal'
import { initVoteState, buildVoteEntries } from '@/lib/date/votes'
import { VALID_HOURS } from '@/types/domain'
import { cn } from '@/lib/utils'
import type { TimeSlot, VoteMode } from '@/types/domain'

export type { VoteEntry } from '@/lib/date/votes'

import type { VoteEntry } from '@/lib/date/votes'

interface Props {
  dateRangeStart: string
  dateRangeEnd: string
  voteMode?: VoteMode
  initialVotes?: VoteEntry[]
  onChange: (votes: VoteEntry[]) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatLabel(dateStr: string) {
  const d = new Date(dateStr)
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: DAY_LABELS[d.getDay()],
    isSunday: d.getDay() === 0,
    isSaturday: d.getDay() === 6,
  }
}

function formatHour(h: string) {
  return `${parseInt(h, 10)}시`
}


export function DateVotePicker({ dateRangeStart, dateRangeEnd, voteMode = 'date_only', initialVotes, onChange }: Props) {
  const dates = getDatesInRange(dateRangeStart, dateRangeEnd)
  const init = initVoteState(dates, initialVotes)
  const [available, setAvailable] = useState<Set<string>>(init.available)
  const [slots, setSlots] = useState<Record<string, Set<TimeSlot>>>(init.slots)

  function emit(nextAvailable: Set<string>, nextSlots: Record<string, Set<TimeSlot>>) {
    onChange(buildVoteEntries(nextAvailable, nextSlots))
  }

  function toggleDate(date: string) {
    const next = new Set(available)
    if (next.has(date)) next.delete(date)
    else next.add(date)
    setAvailable(next)
    emit(next, slots)
  }

  function toggleSlot(date: string, slot: TimeSlot) {
    const nextSlots = { ...slots, [date]: new Set(slots[date]) }
    if (nextSlots[date].has(slot)) nextSlots[date].delete(slot)
    else nextSlots[date].add(slot)
    setSlots(nextSlots)
    emit(available, nextSlots)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-xs text-gray-500 mb-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 가능
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> 불가능
        </span>
      </div>

      <div className="space-y-1.5">
        {dates.map(date => {
          const { month, day, dayOfWeek, isSunday, isSaturday } = formatLabel(date)
          const isAvailable = available.has(date)
          const selectedSlots = slots[date]

          return (
            <div key={date} className="rounded-xl border overflow-hidden">
              {/* 날짜 토글 버튼 */}
              <button
                type="button"
                onClick={() => toggleDate(date)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                  isAvailable ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                <span className={cn(
                  'text-base font-semibold w-6 text-center',
                  !isAvailable && (isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'),
                )}>
                  {day}
                </span>
                <span className={cn(
                  'text-xs',
                  !isAvailable && (isSunday ? 'text-red-400' : isSaturday ? 'text-blue-400' : 'text-gray-400'),
                )}>
                  {month}월 {dayOfWeek}
                </span>
                <span className={cn('ml-auto text-xs', isAvailable ? 'text-blue-100' : 'text-gray-300')}>
                  {isAvailable ? '가능' : '불가능'}
                </span>
              </button>

              {/* 시간대 그리드 — date_time 모드에서만 표시 */}
              {isAvailable && voteMode === 'date_time' && (
                <div className="px-3 py-2.5 bg-blue-50 border-t border-blue-100 space-y-1.5">
                  <p className="text-xs text-blue-500 font-medium">가능한 시간 선택 (선택 안 하면 하루 종일)</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {VALID_HOURS.map(hour => {
                      const on = selectedSlots.has(hour)
                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => toggleSlot(date, hour)}
                          className={cn(
                            'py-1 rounded-lg text-xs font-medium transition-colors border',
                            on
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300',
                          )}
                        >
                          {formatHour(hour)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
