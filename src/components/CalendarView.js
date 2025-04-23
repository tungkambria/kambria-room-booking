import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import viVN from "date-fns/locale/vi";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { formatDateGMT7, generateOccurrences } from "../utils";

const locales = { "vi-VN": viVN };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = ({ room, bookings }) => {
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());
  const [roomName, setRoomName] = useState(room.name);

  const generateAllEvents = () => {
    const allEvents = [];

    bookings.forEach((b) => {
      if (b.isRecurring) {
        const occurrences = generateOccurrences(
          new Date(b.date),
          new Date(b.recurrenceEndDate),
          b.recurrenceType,
          b.recurrenceDays
        );

        occurrences.forEach((date) => {
          allEvents.push({
            title: `${b.name} - ${b.purpose || "Meeting"} (${room.name})`,
            start: new Date(`${formatDateGMT7(date)}T${b.startTime}`),
            end: new Date(`${formatDateGMT7(date)}T${b.endTime}`),
            allDay: false,
          });
        });
      } else {
        allEvents.push({
          title: `${b.name} - ${b.purpose || "Meeting"} (${room.name})`,
          start: new Date(`${b.date}T${b.startTime}`),
          end: new Date(`${b.date}T${b.endTime}`),
          allDay: false,
        });
      }
    });

    return allEvents;
  };

  const events = generateAllEvents();

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  useEffect(() => {
    setRoomName(room.name);
  }, [room]);

  return (
    <div style={{ height: "550px", marginTop: "20px" }}>
      <h5>Calendar for {roomName}</h5>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        views={["day", "week", "agenda"]}
        style={{ height: 500 }}
        date={date}
        onNavigate={handleNavigate}
        defaultView="week"
      />
    </div>
  );
};

export default CalendarView;
