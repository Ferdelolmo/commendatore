import { Task } from '@/types';

export function getGoogleCalendarUrl(task: Task): string {
    // Parse date and time
    // task.date format: "June 21, 2026" or "2026-06-21" (from flexible input)
    // task.eventTime format: "14:00"

    const dateTimeString = `${task.date} ${task.eventTime}`;
    const startDate = new Date(dateTimeString);

    if (isNaN(startDate.getTime())) {
        console.error('Invalid date format for task:', task);
        return '#';
    }

    // Default duration: 1 hour
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const title = encodeURIComponent(task.title);

    // Construct description with relevant details
    let details = `${task.description || ''}`;
    if (task.assignee) details += `\n\nAssignee: ${task.assignee}`;
    if (task.category) details += `\nCategory: ${task.category}`;
    if (task.priority) details += `\nPriority: ${task.priority}`;

    const encodedDetails = encodeURIComponent(details);
    const location = encodeURIComponent(task.event || '');
    const emails = encodeURIComponent('weddingchiarafer@gmail.com');

    // Action=TEMPLATE triggers the create event page
    // add={email} attempts to add the guest (works intermittently in some GCal versions/organizations, 
    // but mostly just opens the calendar. We rely on the user saving it).
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${encodedDetails}&location=${location}&add=${emails}`;
}
