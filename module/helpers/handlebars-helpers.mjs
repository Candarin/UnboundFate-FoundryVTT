// Register all Handlebars helpers for the system
export function registerUnboundFateHandlebarsHelpers() {
  // Absolute value helper
  Handlebars.registerHelper('abs', function(value) {
    return Math.abs(Number(value));
  });

  // toLowerCase helper (from boilerplate)
  Handlebars.registerHelper('toLowerCase', function (str) {
    return String(str).toLowerCase();
  });

 // Handlebars helper: range(start, end) => [start, ..., end]
Handlebars.registerHelper('range', function(start, end) {
  start = Number(start);
  end = Number(end);
  let result = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
});

// Handlebars helper: formatDate(timestamp) => formatted date string
Handlebars.registerHelper('formatDate', function(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  // Format as YYYY-MM-DD HH:mm (24h)
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
});

  // Add more helpers here as needed
}

