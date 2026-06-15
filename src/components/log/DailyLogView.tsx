// @ts-nocheck
import { Activity, Dumbbell, Timer } from 'lucide-react';
import { getDateKey, toDate, formatDate, formatDuration, getMonthStart } from '../../utils/logFormatters';
import { EmptyState, StatPill } from './LogSharedComponents';
import LogCalendar from './LogCalendar';
import DailyLogCard from './DailyLogCard';

export default function DailyLogView({ logSummaries, logsByDate, selectedDate, setSelectedDate, monthDate, setMonthDate, exercisesById, sessionsById, routinesById }: any) {
  const selectedDateKey = getDateKey(selectedDate);
  const selectedLogs = (logsByDate.get(selectedDateKey) || [])
    .slice()
    .sort((a, b) => toDate(a.start_time)?.getTime() - toDate(b.start_time)?.getTime());

  const selectedRecords = selectedLogs.flatMap((log) => log.records);
  const totalMinutes = selectedLogs.reduce((sum, log) => {
    const start = toDate(log.start_time);
    const end = toDate(log.end_time);
    if (!start || !end) return sum;
    return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }, 0);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setMonthDate(getMonthStart(date));
  };

  return (
    <div className="log-view-grid log-view-grid--daily">
      <LogCalendar
        monthDate={monthDate}
        selectedDateKey={selectedDateKey}
        activityByDate={logsByDate}
        sessionsById={sessionsById}
        onSelectDate={handleSelectDate}
        onMonthChange={(delta) => {
          const next = new Date(monthDate);
          next.setMonth(next.getMonth() + delta);
          setMonthDate(getMonthStart(next));
        }}
      />

      <section className="log-panel log-day-panel">
        <div className="log-panel-header">
          <div>
            <span className="log-kicker">Daily Log</span>
            <h2>{formatDate(selectedDate, { month: 'long', day: 'numeric', weekday: 'long' })}</h2>
          </div>
        </div>

        <div className="log-stat-row">
          <StatPill label="운동" value={`${selectedLogs.length}회`} icon={Activity} />
          <StatPill label="세트" value={`${selectedRecords.length}세트`} icon={Dumbbell} />
          <StatPill label="시간" value={totalMinutes > 0 ? formatDuration(new Date(0), new Date(totalMinutes * 60000)) : '0분'} icon={Timer} />
        </div>

        <div className="log-scroll-area">
          {logSummaries.length === 0 ? (
            <EmptyState title="아직 기록이 없습니다" body="더미 데이터를 만들거나 운동 기록을 저장하면 이곳에 표시됩니다." />
          ) : selectedLogs.length === 0 ? (
            <EmptyState title="선택한 날짜의 기록이 없습니다" body="달력에서 표시된 날짜를 눌러 하루 기록을 확인하세요." />
          ) : (
            selectedLogs.map((log) => {
              const session = sessionsById.get(log.session_id);
              const routine = session ? routinesById.get(session.routine_id) : null;
              return (
                <DailyLogCard
                  key={log.id}
                  log={log}
                  records={log.records}
                  exercisesById={exercisesById}
                  session={session}
                  routine={routine}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
