export function timestampMicrosecond(date: Date): number {
  return date.getTime() * 1000; // Convert milliseconds to microseconds
}

export function parseDateTime(dateStr: string): Date {
  // Parse format: "dd/mm/yyyy, hh:mm:ss"
  const [datePart, timePart] = dateStr.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  
  return new Date(year, month - 1, day, hour, minute, second);
}
