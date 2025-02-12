const scheduleJoinQuest = () => {
  const habId = 'your-habitica-user-id';
  const habToken = 'your-habitica-api-token';
  const partyAPI = 'https://habitica.com/api/v3/groups/party';

  const headers = {
    'x-api-user': habId,
    'x-api-key': habToken,
    'Content-Type': 'application/json'
  };

  try {
    Logger.log('Fetching party quest status...');
    
    const response = UrlFetchApp.fetch(partyAPI, { method: 'get', headers });
    const responseData = JSON.parse(response.getContentText());

    if (!responseData || !responseData.data || !responseData.data.quest) {
      Logger.log('No quest data found.');
      return;
    }

    const { quest } = responseData.data;
    Logger.log(`Quest key: ${quest.key}, Active: ${quest.active}, Joined: ${quest.members[habId]}`);

    if (quest.key && !quest.active && !quest.members[habId]) {
      Logger.log('Joining the quest...');
      
      const joinResponse = UrlFetchApp.fetch(`${partyAPI}/quests/accept`, { method: 'post', headers });
      Logger.log(`Join response: ${joinResponse.getResponseCode()} - ${joinResponse.getContentText()}`);
    } else {
      Logger.log('No action taken. Either the quest is already active or the user is already joined.');
    }
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
};
