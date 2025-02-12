# Habitica Google Calendar Sync (google_celndar_to_habitica.js)

This Google Apps Script fetches events from a Google Calendar named `HabiticaReminders` and creates Habitica To-Do tasks for each event. Each task is added with today's date as the due date and includes the event title and description.  

## Setup
- Update the script with your Habitica API credentials (`x-api-user` and `x-api-key`).
- Ensure a Google Calendar named `HabiticaReminders` exists with events.
- Run the script in Google Apps Script to sync tasks.
