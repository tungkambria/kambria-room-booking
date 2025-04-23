import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import viVN from "date-fns/locale/vi";
import "react-big-calendar/lib/css/react-big-calendar.css";

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
  const [date, setDate] = useState(new Date()); // Add date state for navigation

  const events = bookings
    .filter((b) => b.room === room)
    .map((b) => ({
      title: `${b.name} (${b.room})`,
      start: new Date(`${b.date}T${b.startTime}`),
      end: new Date(`${b.date}T${b.endTime}`),
      allDay: false,
    }));

  const handleNavigate = (newDate) => {
    setDate(newDate); // Update date when navigating
  };

  return (
    <div style={{ height: "550px", marginTop: "20px" }}>
      <h5>Calendar for {room}</h5>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        views={["day", "week", "agenda"]}
        style={{ height: 500 }}
        date={date} // Controlled current date
        onNavigate={handleNavigate} // Navigation handler
        defaultView="week"
      />
    </div>
  );
};

export default CalendarView;
