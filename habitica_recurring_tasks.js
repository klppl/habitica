// ============ CONFIGURATION =============
// Replace these with your Habitica credentials (or load them via PropertiesService)
var USER_ID = "habitica-user-id";
var API_TOKEN = "habitica-api-token";
var HABITICA_URL = "https://habitica.com/api/v3/tasks/user";

// ================= TASKS DEFINITION =================
// Use a comma-separated format: "Task, Frequency, Period"
var TASKS_TEXT = `
Empty trashcan, 3, week
Water the plants, 5, month
Read a book, 7, year
`;

// Key used for persisting progress in Script Properties.
var PROGRESS_KEY = "HABITICA_PROGRESS";

// ============ HELPER FUNCTIONS =============

// Format a Date object as "YYYY-MM-DD"
function formatDate(date) {
  if (!date) {
    Logger.log("Error: formatDate received an undefined date.");
    return "";
  }
  if (!(date instanceof Date)) {
    Logger.log("Error: formatDate received a non-Date object: " + date);
    return "";
  }
  var yyyy = date.getFullYear();
  var mm = ("0" + (date.getMonth() + 1)).slice(-2);
  var dd = ("0" + date.getDate()).slice(-2);
  return yyyy + "-" + mm + "-" + dd;
}

// Compute due date based on period.
// For week: upcoming Sunday (if today is Sunday, due date is today),
// for month: last day of current month,
// for year: December 31 of current year.
function computeDueDate(period, today) {
  if (!today) {
    Logger.log("computeDueDate: 'today' is undefined. Using new Date().");
    today = new Date();
  }
  
  period = period.toLowerCase();
  
  if (period === "week") {
    // In JS, Sunday is 0. If today is not Sunday, add (7 - today.getDay()) days.
    var daysToAdd = (today.getDay() === 0) ? 0 : (7 - today.getDay());
    return new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    // new Date(year, month+1, 0) gives the last day of the current month.
    return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (period === "year") {
    return new Date(today.getFullYear(), 11, 31);
  } else {
    Logger.log("Unknown period: " + period + ". Defaulting due date to today.");
    return today;
  }
}

// ================= HELPER FUNCTION TO LOAD TASKS =================
// Returns an array of objects: { line, name, frequency, period }
function loadTasks() {
  var tasks = [];
  // Trim and split by newline
  var lines = TASKS_TEXT.trim().split("\n");
  lines.forEach(function(line) {
    line = line.trim();
    // Skip empty lines or lines starting with '#' (comments)
    if (!line || line.startsWith("#")) return;
    // Expecting CSV format: Task, Frequency, Period
    var parts = line.split(",");
    if (parts.length < 3) {
      Logger.log("Line format incorrect, skipping: " + line);
      return;
    }
    var name = parts[0].trim();
    var frequency = parseInt(parts[1].trim(), 10);
    var period = parts[2].trim().toLowerCase();
    tasks.push({
      // Construct a unique key from the structured data
      line: name + " / " + frequency + " times " + period,
      name: name,
      frequency: frequency,
      period: period
    });
  });
  return tasks;
}

// Load progress data from Script Properties.
// Returns an object mapping each task (by its line string) to { progress, lastReset }.
function loadProgress() {
  var props = PropertiesService.getScriptProperties();
  var progressStr = props.getProperty(PROGRESS_KEY);
  if (progressStr) {
    try {
      return JSON.parse(progressStr);
    } catch (e) {
      Logger.log("Error parsing progress. Resetting progress.");
    }
  }
  return {};
}

// Save progress object to Script Properties.
function saveProgress(progress) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(PROGRESS_KEY, JSON.stringify(progress));
}

// Determines if a reset is due for a task based on its period.
// For week: reset on Monday (getDay() === 1), for month: on day 1,
// for year: on January 1. Compares with lastReset (in "YYYY-MM-DD").
function shouldReset(period, lastReset, today) {
  var todayStr = formatDate(today);
  if (lastReset === todayStr) {
    return false; // already reset today
  }
  if (period === "week" && today.getDay() === 1) { // Monday (JS: Sunday=0, Monday=1)
    return true;
  } else if (period === "month" && today.getDate() === 1) {
    return true;
  } else if (period === "year" && today.getMonth() === 0 && today.getDate() === 1) {
    return true;
  }
  return false;
}

// Fetch active Habitica todos. (Uses type=todos)
// Returns an array of tasks.
function getActiveHabiticaTasks() {
  var url = HABITICA_URL + "?type=todos";
  var options = {
    "method": "get",
    "headers": {
      "x-api-user": USER_ID,
      "x-api-key": API_TOKEN,
      "Content-Type": "application/json"
    },
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    var data = JSON.parse(response.getContentText());
    return data.data;
  } else {
    Logger.log("Failed to get active tasks: " + response.getResponseCode() + " " + response.getContentText());
    return [];
  }
}

// Delete a Habitica task by its id.
function deleteHabiticaTask(taskId) {
  var url = HABITICA_URL + "/" + taskId;
  var options = {
    "method": "delete",
    "headers": {
      "x-api-user": USER_ID,
      "x-api-key": API_TOKEN,
      "Content-Type": "application/json"
    },
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    Logger.log("Deleted Habitica task " + taskId);
  } else {
    Logger.log("Failed to delete task " + taskId + ": " + response.getResponseCode() + " " + response.getContentText());
  }
}

// Post a new Habitica todo with taskText and due date.
function postHabiticaTask(taskText, dueDate) {
  var payload = {
    "text": taskText,
    "type": "todo",
    "date": formatDate(dueDate),
    "priority": 1.5,
    "notes": "Automated task for habit tracking"
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "x-api-user": USER_ID,
      "x-api-key": API_TOKEN
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(HABITICA_URL, options);
  if (response.getResponseCode() === 201) {
    Logger.log("Task '" + taskText + "' successfully added to Habitica (due " + formatDate(dueDate) + ")!");
    return true;
  } else {
    Logger.log("Failed to add task '" + taskText + "': " + response.getResponseCode() + " " + response.getContentText());
    return false;
  }
}

// ============ MAIN FUNCTION =============

function main() {
  var today = new Date();
  var todayStr = formatDate(today);
  var tasks = loadTasks();
  var progress = loadProgress();
  var activeTasks = getActiveHabiticaTasks();
  
  tasks.forEach(function(task) {
    var key = task.line; // using the whole line as a unique key
    if (!progress[key]) {
      progress[key] = { progress: 0, lastReset: "" };
    }
    var taskProgress = progress[key];
    
    // Check if it's time to reset (and if we haven't already reset today)
    if (shouldReset(task.period, taskProgress.lastReset, today)) {
      Logger.log("Resetting progress for '" + task.name + "'");
      taskProgress.progress = 0;
      taskProgress.lastReset = todayStr;
      // Delete any active Habitica tasks that match this task.
      activeTasks.forEach(function(ht) {
        if (ht.text.toLowerCase().indexOf(task.name.toLowerCase() + " (") === 0) {
          deleteHabiticaTask(ht.id);
        }
      });
      activeTasks = getActiveHabiticaTasks();
    }
    
    var completed = taskProgress.progress;
    if (completed >= task.frequency) {
      Logger.log("Task '" + task.name + "' has reached its target of " + task.frequency + " for this period.");
      return; // continue to next task
    }
    
    var nextInstance = completed + 1;
    var expectedText = task.name + " (" + nextInstance + " of " + task.frequency + ")";
    
    // Check if the expected next instance already exists (case-insensitive).
    var existsNext = activeTasks.some(function(ht) {
      return ht.text.trim().toLowerCase() === expectedText.trim().toLowerCase();
    });
    if (existsNext) {
      Logger.log("Task '" + expectedText + "' is already active. Skipping.");
      return;
    }
    
    // If a previous instance exists (and hasn't been completed), wait.
    if (completed > 0) {
      var previousText = task.name + " (" + completed + " of " + task.frequency + ")";
      var existsPrevious = activeTasks.some(function(ht) {
        return ht.text.trim().toLowerCase() === previousText.trim().toLowerCase();
      });
      if (existsPrevious) {
        Logger.log("Previous task '" + previousText + "' is still active. Waiting for completion.");
        return;
      }
    }
    
    // Compute due date based on the task's period.
    var dueDate = computeDueDate(task.period, today);
    
    // Post the task.
    if (postHabiticaTask(expectedText, dueDate)) {
      // Update progress only if posting succeeded.
      taskProgress.progress = nextInstance;
      activeTasks = getActiveHabiticaTasks();
    }
  });
  
  // Save updated progress.
  saveProgress(progress);
}

