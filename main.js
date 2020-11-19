var token = "";
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "";

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function setWebHook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hello" + JSON.stringify(e)); 
}

function getNames(exercise) {
  //obtain a list of names from the google spreadsheet and create keyboard
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var keyBoard = {
    "inline_keyboard": [] 
  }
  for (var i = 3; i < data.length; i+=2) {
    Logger.log('Name: ' + data[i][0]);
    var nameOpt = [{"text": data[i][0], 'callback_data': "Name " + String(i) + " " + exercise}];
    keyBoard["inline_keyboard"].push(nameOpt);
  }
  keyBoard["resize_keyboard"] = true;
  keyBoard["one_time_keyboard"] = true;
  Logger.log(JSON.stringify(keyBoard));
  return keyBoard;
}

function getExercises(command) {
  var keyBoard = {
    "inline_keyboard": [
      [{"text": "Arms", 'callback_data': 'Exercise Arms ' + command}],
      [{"text": "Butt", 'callback_data': 'Exercise Butt ' + command}],
      [{"text": "Cardio", 'callback_data': 'Exercise Cardio ' + command}],
      [{"text": "Core", 'callback_data': 'Exercise Core ' + command}],
      [{"text": "Legs", 'callback_data': 'Exercise Legs ' + command}],
      [{"text": "Stretching", 'callback_data': 'Exercise Stretching ' + command}]
    ],
    "resize_keyboard": true,
    "one_time_keyboard":true
  };
  Logger.log(keyBoard);
  return keyBoard;
}

//stores chat id and username of user
function storeUserInfo(id, username, name) { 
  var userProperties = PropertiesService.getUserProperties();
  if (name == "group") {
    var groupData = [id];
    groupData = JSON.stringify(groupData);
    userProperties.setProperty("group", groupData);
    sendText2(id, "Group pushed.");
    return true;
  }
  var nameRow = getRowfromName(name);
  if (nameRow == -1) { //this means the person didnt spell name correctly
    Logger.log("Incorrect name!");
    return false; 
  }
  var userData = [id, username]
  userData = JSON.stringify(userData);  
  userProperties.setProperty(String(nameRow), userData);
  Logger.log(userData);
  return true;
}

function getFontColour(exercise) {
  if (exercise == "Arms") {
    return "magenta";
  }
  else if (exercise == "Butt") {
    return "purple";
  }
  else if (exercise == "Cardio") {
    return "red";
  }
  else if (exercise == "Core") {
    return "green"; 
  }
  else if (exercise == "Legs") {
    return "blue";
  }
  else if (exercise == "Stretching") {
    return "orange";
  }
  
}
function sendText(chatId, text, keyBoard) {
   var options = {
    'method': "post",
    'payload': {
       'method': "sendMessage",
       'chat_id': String(chatId),
       'text': text,
       'parse_mode': "HTML",
       'reply_markup': JSON.stringify(keyBoard)
     }
   };
  var response = UrlFetchApp.fetch(telegramUrl + "/", options);
  Logger.log(response.getContentText());
}

function sendText2(chatId, text) {
  var options = {
    'method': "post",
    'payload': {
       'method': "sendMessage",
       'chat_id': String(chatId),
       'text': text,
       'parse_mode': "HTML",
     }
   };
  var response = UrlFetchApp.fetch(telegramUrl + "/", options);
  Logger.log(response.getContentText()); 
}


function calculateData() {
  var numberCompleted = {
    "arms": {},
    "butt": {},
    "cardio": {},
    "core": {},
    "legs": {},
    "stretching":{}
  }
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  var exercises = ["arms", "butt", "cardio", "core", "legs", "stretching"];
  var lastCol = sheet.getLastColumn();
  for (var i = 3; i < data.length; i+=2) {
     var individual = {
       'name': "",
       'arms': 0,
       'last_completed_arms':0,
       'butt': 0,
       'last_completed_butt':0,
       'cardio': 0,
       'last_completed_cardio':0,
       'core': 0,
       'last_completed_core':0,
       'legs': 0,
       'last_completed_legs':0,
       'stretching': 0,
       'last_completed_stretching':0
     }
    individual.name = data[i][0];
    for (var j = 1; j < lastCol; j++) {
      if (data[i][j] != "") { //can optimise this repetition?
        var exercise = data[i][j];
        for (var e = 0 ; e < exercises.length; e++) {
          if (exercise.toLowerCase() == exercises[e]) {
            individual[exercises[e]] += 1;
            individual["last_completed_"+exercises[e]] = data[2][j].getDate() + " " + months[data[2][j].getMonth()];
          }
        }
        if (data[i+1][j] != "") {
          var exercise = data[i+1][j];
          for (var e = 0 ; e < exercises.length; e++) {
            if (exercise.toLowerCase() == exercises[e]) {
              individual[exercises[e]] += 1;
              individual["last_completed_"+exercises[e]] = data[2][j].getDate() + " " + months[data[2][j].getMonth()];
            }
          }
        }
      }
    }
    numberCompleted = incorporateData(individual, numberCompleted);
  }
  //stores the data
  var scriptProperties = PropertiesService.getScriptProperties();
  for (var exe in numberCompleted) {
      numberCompleted[exe] = JSON.stringify(numberCompleted[exe]);
  }
  Logger.log(numberCompleted);
  scriptProperties.setProperties(numberCompleted);
}

function incorporateData(individual, numberCompleted) {
  var exercises = ["arms", "butt", "cardio", "core", "legs", "stretching"]
  for (var i = 0; i < exercises.length; i++) {
    var valueCompleted = String(individual[exercises[i]]);
    if (!numberCompleted[exercises[i]].hasOwnProperty(valueCompleted)) { 
       numberCompleted[exercises[i]][valueCompleted] = []; 
    }
    numberCompleted[exercises[i]][valueCompleted].push(individual["name"]);
  }
  return numberCompleted;
}


function getData(exercise) {
  exercise = exercise.toLowerCase();
  var scriptProperties = PropertiesService.getScriptProperties();
  var strData = scriptProperties.getProperty(exercise);
  Logger.log(strData);
  var data = JSON.parse(strData);
  Logger.log(data);
  var returnStr = "";
  for (var key in data) {
    returnStr += key + " times: ";
    for (var name in data[key]) {
      returnStr += data[key][name] + ", ";
    }
    returnStr += "\n \n";
  }
  Logger.log(returnStr);
  return returnStr;
}


function submitVideo(username, exercise) {
  var submitted = 0;
  var userProperties = PropertiesService.getUserProperties();
  var userData = userProperties.getProperties();
  var reqUser = "";
  for (var user in userData) {
    Logger.log(user);
    if (userData[user].includes(username)) {
       reqUser = user;
       break;
    }
  }
  if (reqUser == "") {
    Logger.log("Your details are not included yet.");
    return -1;
  }
   var nameRow = parseInt(reqUser);
   exercise = exercise.toLowerCase();
   var sheet = SpreadsheetApp.getActiveSheet();
   var data = sheet.getDataRange().getValues();
   var lastCol = sheet.getLastColumn();
   var range = sheet.getRange(nameRow+1,2,2,lastCol-1);
   var results = range.getFontLines();
   nameRow = parseInt(nameRow);
   var i = 0;
   for (var j = lastCol-1; j > 0; j--) { 
     if (data[nameRow][j] != "") {
       Logger.log(data[nameRow][j]);
       Logger.log(data[nameRow+1][j]);
       if (data[nameRow][j].toLowerCase() == exercise && results[i][j-1] != "line-through") {
         Logger.log("here: "+j + " " + i);
          var cell = sheet.getRange(nameRow+1,j+1);              
          cell.setFontLine("line-through");  
          submitted = 1;
          break;
       }
       else if (data[nameRow+1][j].toLowerCase() == exercise && results[i+1][j-1] != "line-through") {
         Logger.log("there: "+j + " " + i);
          var cell = sheet.getRange(nameRow+2,j+1);              
          cell.setFontLine("line-through"); 
          submitted = 1;
          break;
       }
     }
   }
  Logger.log(submitted);
  if (submitted == 1) {
    if (j % 3 == 0) { 
      addLeaderboard(nameRow, exercise);
    }
  }
  Logger.log(submitted);
  return submitted;
}

function updateData(name, exercise) {
  exercise = exercise.toLowerCase();
  var scriptProperties = PropertiesService.getScriptProperties();
  var strData = scriptProperties.getProperty(exercise);
  var data = JSON.parse(strData);
  Logger.log(data);
  Logger.log(name);
  Logger.log(exercise);
  for (var key in data) {
    Logger.log(data[key]);
    var lst = data[key];
    if (lst.includes(name)) {
      var index = lst.indexOf(name);
      lst.splice(index, 1);
      var newValue = parseInt(key)+1;
      if (data.hasOwnProperty(String(newValue))) {
        data[String(newValue)].push(name);
        break;
      }
      else {
        data[String(newValue)] = [];
        data[String(newValue)].push(name);
        break;
      }
    }
  }
  data = JSON.stringify(data);
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(exercise, data);
  Logger.log(getData(exercise));;
}

function getUserData() {
  var userProperties = PropertiesService.getUserProperties();
  var userData = userProperties.getProperties()
  Logger.log(userData);
}

function resetUserData() {
  var userdata = {
    
  } 
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperties(userdata);
}

function getRowfromName(name) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 3; i < data.length; i+=2) {
    if (name.toLowerCase() == data[i][0].toLowerCase()) {
      return i;
    }
  }
  return -1;
}

function checkOutstanding(nameRow) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var lastCol = sheet.getLastColumn();
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  var range = sheet.getRange(nameRow+1,2,2,lastCol-1);
  var results = range.getFontLines();
  Logger.log(results);
  var outstanding = "Here are your outstanding records: \n";
  var i = 0;
  for (var j = 0; j < lastCol-1; j++) {
    if (data[nameRow][j+1] != "") { 
      if (results[i][j] != "line-through") {
        outstanding += data[nameRow][j+1] + " ";
        var date = data[2][j+1];
        outstanding += " - " + date.getDate() + " " + months[date.getMonth()] + "\n";    
      }
      if (data[nameRow+1][j+1] != "" && results[i+1][j] != "line-through") {
        outstanding += data[nameRow+1][j+1];
        var date = data[2][j+1];
        outstanding += " - " + date.getDate() + " " + months[date.getMonth()] + "\n";    
      }                                                
    }
  }
  Logger.log(outstanding);
  return outstanding;
}

function addLeaderboard(nameRow, exercise) { 
  var documentProperties = PropertiesService.getDocumentProperties();
  var exerciseData = documentProperties.getProperty(exercise);
  exerciseData = JSON.parse(exerciseData);
  Logger.log(exerciseData);
  if (exerciseData.length < 2) {
    Logger.log("Pushed");
    exerciseData.push(nameRow);
  }
  exerciseData = JSON.stringify(exerciseData);
  documentProperties.setProperty(exercise, exerciseData);
}

function resetLeaderboard() {
  var exerciseData = {
    "arms": [],
    "butt": [],
    "cardio": [],
    "core": [],
    "legs": [],
    "stretching":[]
  } 
  for (var exercise in exerciseData) {
    exerciseData[exercise] = JSON.stringify(exerciseData[exercise]); 
  }
  var documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.setProperties(exerciseData);
}

function getLeaderboard() {
  var returnStr = "___________________________________ \n";
  returnStr += "|                 LEADERBOARD                  | \n";
  returnStr += "___________________________________ \n";
  var documentProperties = PropertiesService.getDocumentProperties();
  var userProperties = PropertiesService.getUserProperties();
  var userData = userProperties.getProperties();
  Logger.log(userData);
  var leaderboardData = documentProperties.getProperties();
  Logger.log(leaderboardData);
  for (var exercise in leaderboardData) {
    returnStr += "| " + exercise + " | ";
    var exerciseData = JSON.parse(leaderboardData[exercise]);
    Logger.log(exerciseData);
    for (var user in exerciseData) {
      var specificInfo = userData[exerciseData[user]];
      if (specificInfo == null) {
         returnStr += "@idkwho,"; 
      }
      else {
        Logger.log(specificInfo);
        specificInfo = JSON.parse(specificInfo);
        returnStr += "@" + specificInfo[1] + ", ";
      }
    }
    returnStr += "\n";
  }
  Logger.log(returnStr);
  return returnStr;
}

function checkLeaderboard(userRow, exercise) {
  var documentProperties = PropertiesService.getDocumentProperties();
  var exerciseData = documentProperties.getProperty(exercise.toLowerCase());
  exerciseData = JSON.parse(exerciseData);
  if (exerciseData.includes(userRow)) {
     return true; 
  }
  return false; 
}

function nominateSpreadsheet(nominer, nominee, exercise) {
  var nominerRow = -1;
  var nominate = 0;
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var lastCol = sheet.getLastColumn();
  Logger.log(lastCol);
  var col = -1;
  var userProperties = PropertiesService.getUserProperties();
  var userData = userProperties.getProperties();
  for (var user in userData) {
    Logger.log(user);
    if (userData[user].includes(nominer)) {
       nominerRow = parseInt(user);
       Logger.log(user);
       break;
    }
  }
  if (nominerRow == -1) {
     return -7; 
  }
  Logger.log("Nominer Row:" + nominerRow);
  var date = new Date();
  var minCol = lastCol-1;
  if (date.getTime() > data[2][minCol].getTime()) {
    return -8;
  }
  while (date.getTime() < data[2][minCol].getTime()) {
    minCol--;
  }
  minCol++; 
  if (minCol % 3 == 0) { 
    var endOfWeek = minCol;
  }
  else if (minCol % 3 == 1) { 
    var onLeaderboard = checkLeaderboard(nominerRow, exercise);
    if (!onLeaderboard) { //not on leaderboard
      if (date.getDay() == 0 || date.getDay() == 7) { 
        Logger.log("You are not on the leaderboard for this exercise. You don't have RIGHTS to nominate!");
        return -5;  
      }
      else { 
          endOfWeek = minCol+2;
      }
    }
    else {    
      var endOfWeek = -1;
      col = minCol;
    }
  }
  else {
    var endOfWeek = minCol + 1;
  }
  Logger.log("End of week: " + endOfWeek); //checks the deadline of the person who nominated in that week 
  //only for those who nominating for a thurs/sat deadline
  if (endOfWeek != -1) { //endOfWeek = -1 means that they are leaderboard people, so no need to check
    for (var j = endOfWeek-2; j < endOfWeek; j++) {  //this finds the next deadline after the person who nominated, but only for tues/thursday
      if (data[nominerRow][j] != "") {
        if (data[nominerRow][j].toLowerCase() == exercise.toLowerCase() || data[nominerRow+1][j].toLowerCase() == exercise.toLowerCase()) {
          col = j+1; //col can only be thursday or saturday
          Logger.log(col);
          break;
        }
      }
    }
    //minCol is either thursday or saturday since endOfWeek != -1
    if (col < minCol) {  //if deadline over, automatically go to next deadline, e.g. minCol is saturday (person nominated on tues/wed) but col is thursday
      //i think not possible minCol is thursday and col is tuesday since from the earlier loop, col can only be endOfWeek-1 (thurs)/ endOfWeek (sat)
      col = minCol;
    }
    if (j == endOfWeek) { //if loop completes without finding that exercise for the nominer
      //this might be triggered if the person nominates on thursday (endOfWeek is saturday, not -1) but the person's deadline is saturday
      if (data[nominerRow][j].toLowerCase() == exercise.toLowerCase() || data[nominerRow+1][j].toLowerCase() == exercise.toLowerCase()) {
          Logger.log(" Can't nominate since your deadline is due Saturday.");
          return -6;
      }
      else {
        Logger.log("You haven't been nominated for this exercise this week");
        return -1;
      }
    }
  }
  //if leaderboard, then need to check the following week for the nominee
  var count = 0;
  if (endOfWeek == -1) { //col, mincol is tuesday
    endOfWeek = col+2; 
  }
  //check if the person has been nominated for that exercise in that week
  for (var y = endOfWeek-2; y <= endOfWeek; y++) {
    for (var x = 0; x < 2; x++) {
      if (data[nominee+x][y] == exercise) {
        Logger.log("Already completed/been nominated for the exercise in the week.");
        return -2;
      }
      if (data[nominee+x][y] != "") { //if not empty in that week -> add
         count++; 
      }
    }
  }
  if (count >= 3) { // if more than 3 exercises that week
     Logger.log("Count :"+ count);
     return -3; 
  }
  if (data[nominee][col] == "") { //if the spot empty
     Logger.log("HERE");
     var textcolour = getFontColour(exercise);
     sheet.getRange(nominee+1,col+1).setValue(exercise);
     sheet.getRange(nominee+1,col+1).setFontColor(textcolour);
     sheet.getRange(nominee+1,col+1).setFontWeight("bold");
     nominate = true;
     return 1;
  }
  else if (data[nominee+1][col] == "") { //if the spot empty
     Logger.log("THERE");
     var textcolour = getFontColour(exercise);
     sheet.getRange(nominee+2, col+1).setValue(exercise);
     sheet.getRange(nominee+2, col+1).setFontColor(textcolour);
     sheet.getRange(nominee+2, col+1).setFontWeight("bold");
     nominate = true;
     return 1;
  }
  if (data[nominee][col] != "" && data[nominee+1][col] != "") {
    Logger.log("At quota for that deadline.");
    return -4;
  }
  return nominate;
  //add the reduction of possible nominations for LEADERBOARD
}

function checkNominatePermissions(username) {
  var nominations = -1;
  var userProperties = PropertiesService.getUserProperties();
  for (var user in userProperties) {
    var userData = JSON.parse(userProperties.getProperty(user));
    if (userData.includes(username)) {
       nominations = userData[2];
       break;
    }
  }
  return (nominations != -1 && nominations > 0);
}

function calcDataWeekNom(input) {
  var dataNom = {};
  //input = "Arms";
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  //var date = new Date("05-05-2020");
  var date = new Date();
  var lastCol = sheet.getLastColumn();
  Logger.log(lastCol);
  if (date.getTime() >= data[2][lastCol-1].getTime()) {
     Logger.log("Haven't included the date.");
     return -1;
  }
  var minCol = lastCol-1;
  while (date.getTime() < data[2][minCol].getTime()) { //if Saturday, 
    minCol--;
  }
  Logger.log("day:" + date.getDay());
  Logger.log("Mincol:"+minCol);
  if (minCol % 3 == 0) {
    if (date.getDay() <= 1) { //if asks on a monday/sunday
      var endOfWeek = minCol + 3;
    }
    else { //asks on a sunday/saturday
      var endOfWeek = minCol;
    }
  }
  else { //if friday -> mincol is thursday
    var endOfWeek = minCol + (3-minCol%3);
  }
  Logger.log("End of week:" + endOfWeek);
  for (var i = 3 ; i < data.length; i += 2) {//for every name
     var count = 0;
     Logger.log("i"+ i);
     for (var y = endOfWeek-2; y <= endOfWeek; y++) {
        for (var x = 0; x < 2; x++) {
          if (input == "") {
            if (data[i+x][y] != input) { //if not empty in that week -> add //if EXERCISE SPECIFIC
              count++; 
            }
          }
          else {
            if (data[i+x][y] == input) { //if not empty in that week -> add //if EXERCISE SPECIFIC
               count++; 
             }
          }
        }
      }
      Logger.log("Count: " + count);
      if (dataNom.hasOwnProperty(String(count))) {
        dataNom[String(count)].push(data[String(i)][0]);
      }
      else {
        dataNom[String(count)] = [data[String(i)][0]];
      }
   }
   Logger.log(dataNom);
   dataNom = getNomData(dataNom);
   Logger.log(dataNom);
   return dataNom;
}

function getNomData(dataNom) {
  var returnStr = "";
  for (var key in dataNom) {
    returnStr += key + " times: ";
    for (var name in dataNom[key]) {
      returnStr += dataNom[key][name] + ", ";
    }
    returnStr += "\n \n";
  }
  return returnStr;
}
  
function doPost(e) {
  var contents = JSON.parse(e.postData.contents);
  var data = SpreadsheetApp.getActiveSheet().getDataRange().getValues();
  if (contents.callback_query) {
    var id_callback = contents.callback_query.message.chat.id;
    var name = contents.callback_query.from.username;
    var callback_query_data = contents.callback_query.data.split(" ");
    if (callback_query_data[0] == "Name") { //nominations
      var nameRow = callback_query_data[1];
      //askforPermission(nameRow);
      var exercise = callback_query_data[2];
      nameRow = parseInt(nameRow);
      var nominate = nominateSpreadsheet(name, nameRow, exercise);
      if (nominate > 0) {
        var userProperties = PropertiesService.getUserProperties();
        var groupData = userProperties.getProperty("group");
        groupData = JSON.parse(groupData);
        sendText2(parseInt(groupData[0]), data[nameRow][0] + " has been nominated by @" + name + " for " + exercise);
        updateData(data[nameRow][0], exercise);
        if (userProperties.hasOwnProperty(String(nameRow))) {
            var userData = userProperties.getProperty(String(nameRow));
            userData = JSON.parse(userData);
            sendText2(parseInt(userData[0]), "You have been nominated by @" + name + " for " + exercise);
        }
      }
      else if (nominate == -1) { 
        sendText2(id_callback, "You haven't been nominated for this exercise!");
      }
      else if (nominate == -2) { //already completed exercise that week
        sendText2(id_callback, data[nameRow][0] + " has been nominated for that exercise in that week, please nominate another person.");
        handleNominate(id_callback, exercise);
      }
      else if (nominate == -3) { //more than 3 exercises
        sendText2(id_callback, data[nameRow][0] + " has been nominated for 3 exercises this week already. Be kind and nominate another person!!");
        handleNominate(id_callback, exercise);
      }
      else if (nominate == -4) { //quota for that deadline
        sendText2(id_callback, data[nameRow][0] + " has been nominated for 2 exercises for that deadline already. Be kind and nominate another person!!");
        handleNominate(id_callback, exercise);
      }
      else if (nominate == -5) {
        sendText2(id_callback, "You are not on the leaderboard for this exercise. You don't have RIGHTS!");
      }
      else if (nominate == -6) {
        sendText2(id_callback, "Deadline is Saturday, you can't nominate!");
      }
      else if (nominate == -7) {
        sendText2(id_callback, "Details not included yet. Please call /start (name)");
      }
      else if (nominate == -8) {
        sendText2(id_callback, "Date not included yet!");
      }
    }
    else if (callback_query_data[0] == "Exercise") {
      exercise = callback_query_data[1];
      sendText2(id_callback, exercise + " chosen.");
      if (callback_query_data[2] == "nominate") {
        handleNominate(id_callback, exercise);
      }
      else if (callback_query_data[2] == "whotonominate") {
        var dataExerciseWeek = calcDataWeekNom(exercise);
        sendText2(id_callback, "This week: \n" + dataExerciseWeek);
        var dataExercise = getData(exercise);
        sendText2(id_callback, "Summary:  \n" + dataExercise);
      }
    }
  }
  else if (contents.message) {
    var text = contents.message.text;
    var chat_id = contents.message.chat.id;
    var user_id = contents.message.from.id;
    var username = contents.message.from.username;
    var name = contents.message.chat.first_name + " " + contents.message.chat.last_name;
    var text = contents.message.text; 
    sendText2(chat_id, text + " sent to bot.");
    if (contents.message.hasOwnProperty("entities")) {
      //Logger.log("HERE");
      if (contents.message.entities[0].type == "bot_command") {
        handleCommands(chat_id, text, username, user_id);
      }
    }
  }
}

function handleNominate(id, exercise) {
   var keyBoard = getNames(exercise);
   sendText(id, "Who would you like to nominate?", keyBoard); 
}

function handleCommands(id, text, username, user_id) {
  if (text == "/nominate") {
     //checkNominatePermissions(username);
     var keyBoard = getExercises("nominate");
     sendText(id, "What exercise are you nominating for?", keyBoard);
  }
  else if (text == "/whotonominate") { //get data
    sendText(id, "How many times each person has exercised/been nominated for that week: " + calcDataWeekNom(""));
    var keyBoard = getExercises("whotonominate");
    sendText(id, "What exercise are you interested in finding out about?", keyBoard);    
  }
  else if (text.includes("/submit")) { //submit video
    var command = text.split(" ");
    var exercise = command[1];
    var exercises = ["arms", "butt", "cardio", "core", "legs", "stretching"];
    if (exercises.includes(exercise)) {    
      var submitted = submitVideo(username, exercise);
       if (submitted == 1) {
         sendText2(id, "Successfully submitted. Nice work @" + username + "!");
       }
       else if (submitted == 0) {
         sendText2(id, "You aren't actually required to do this... but good job!");
       }
      else if (submitted == -1) {
         sendText2(id, "Details not registered yet.");
      }
    }
    else {
      sendText2(id, "No such exercise.");
    }
  }
  else if (text == "/checkoutstanding") { //outstanding
    var userProperties = PropertiesService.getUserProperties();
    var userData = userProperties.getProperties();
    var reqUser = "";
    for (var user in userData) {
      Logger.log(user);
      if (userData[user].includes(username)) {
        reqUser = user;
        sendText2(id,checkOutstanding(parseInt(reqUser)));
        break;
      }
    }
    if (reqUser == "") {
      Logger.log("Your details are not included yet.");
      sendText2(id, "Your details are not included yet.");
    }
    var nameRow = getRowfromName(name);
  }
  else if (text == "/help") {
    sendText2(id, "Hi! This is your friendly bot for Paradigymmers! There are 5 main commands in total (6, including this.) \n "
              + "/nominate: This will prompt you to nominate someone. \n"
              + "/whotonominate: This will provide data on the number of times an exercise is done by each person, so pick someone who has " 
              + "not done the exercise often! \n"
              + "/submit: Please use this command while sending in your video! "
              + "When submitting a video, please enter /submit (exercise). e.g. /submit  arms \n "
              + "/checkoutstanding: This command enables you to check the outstanding records of yourself. To use it, enter /checkoutstanding \n"
              + "When starting, please do /start (name) \n"
              + "/getleaderboard: You can also obtain information on the leaderboard!");
  }
  else if (text.includes("/start")) { //need to press /start (name)
    var command = text.split(" ");
    command.shift();
    if (command.length == 0) {
      sendText2(id, "Need to call /start (name)");
      return;
    }
    if (command.length > 1) {
      var name = command.join(" ");
    }
    else {
      var name = command[0];
    }
    if (name == "group") {
      var storeUser = storeUserInfo(id, username, name);
    }
    else {
      var storeUser = storeUserInfo(user_id, username, name);
    }
    if (storeUser) {
      sendText2(id, "Successful, welcome to the paradigym bot!");
    }
    else {
      sendText2(id, "Wrong name!");
    }
  }
  else if (text == "/resetleaderboard") {
    resetLeaderboard();
    sendText2(id, "Successfully reset.");
  }
  
  else if (text == "/getleaderboard") {
    var leaderBoard = getLeaderboard();
    sendText2(id, leaderBoard);
  }
}
