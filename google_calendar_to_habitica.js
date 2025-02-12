function scheduleToDos() {
  var habId = "habitica_user_id";
  var habToken = "habitica_api_token";

  Logger.log("Starting scheduleToDos script...");

  var now = new Date();
  var todayISO = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format

  var calendar = CalendarApp.getCalendarsByName("HabiticaReminders");

  if (calendar.length === 0) {
    Logger.log("No calendar found with name 'HabiticaReminders'");
    return;
  }

  var events = calendar[0].getEventsForDay(now);

  Logger.log("Found " + events.length + " events for today.");

  var paramsTemplate = {
    "method": "post",
    "headers": {
      "x-api-user": habId,
      "x-api-key": habToken,
      "Content-Type": "application/json"
    }
  };

  for (var i = 0; i < events.length; i++) {
    var eventTitle = events[i].getTitle();
    var eventNotes = events[i].getDescription();

    Logger.log("Processing event: " + eventTitle);
    Logger.log("Description: " + eventNotes);

    var params = JSON.parse(JSON.stringify(paramsTemplate)); // Clone template to avoid mutation
    params["payload"] = JSON.stringify({
      "text": eventTitle,
      "type": "todo",
      "notes": eventNotes,
      "priority": "1.5",
      "date": todayISO // Set today's date as the due date
    });

    try {
      var response = UrlFetchApp.fetch("https://habitica.com/api/v3/tasks/user", params);
      Logger.log("Successfully added task: " + eventTitle);
      Logger.log("Response: " + response.getContentText());
    } catch (e) {
      Logger.log("Error adding task: " + eventTitle);
      Logger.log(e.toString());
    }
  }

  Logger.log("scheduleToDos script completed.");
}
