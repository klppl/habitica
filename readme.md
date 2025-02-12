# Habitica Google Calendar Sync (`google_calendar_to_habitica.js`)

This Google Apps Script fetches events from a Google Calendar named `HabiticaReminders` and creates Habitica To-Do tasks for each event. Each task is added with today's date as the due date and includes the event title and description.

## Setup
1. Update the script with your Habitica API credentials (`x-api-user` and `x-api-key`).
2. Ensure a Google Calendar named `HabiticaReminders` exists with events.
3. Run the script in Google Apps Script to sync tasks.

---

# Habitica Recurring Tasks Manager (`habitica_recurring_tasks.js`)

This Google Apps Script automates the creation of recurring Habitica To-Do tasks based on predefined task frequencies. It tracks progress and resets tasks weekly, monthly, or yearly, ensuring only the next due instance is active at any time.

## Setup
1. Update the script with your Habitica API credentials (`USER_ID` and `API_TOKEN`).
2. Define your recurring tasks in `TASKS_TEXT` using the format:

   ```plaintext
   Task Name, Frequency, Period
   ```

   Example:

   ```plaintext
   Water the plants, 5, month
   ```

3. Run the `main()` function in Google Apps Script to sync tasks.

---

# Habitica Quest Auto-Join (`habitica_auto_join_quest.js`)

This Google Apps Script automatically checks if a new Habitica party quest is available and joins it if the user hasn't already. It fetches the current quest status and only joins if the quest is inactive and the user is not yet a member.

## Setup
1. Update the script with your Habitica API credentials (`x-api-user` and `x-api-key`).
2. Run the `scheduleJoinQuest()` function in Google Apps Script to check and join available quests.
