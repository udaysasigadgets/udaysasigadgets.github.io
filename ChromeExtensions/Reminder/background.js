// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  Displays a notification with the current time. Requires "notifications"
  permission in the manifest file (or calling
  "webkitNotifications.requestPermission" beforehand).
*/

var water_frequency = 1; //interval in hour

function show() {
  var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
  var hour = time[1] % 12 || 12;               // The prettyprinted hour.
  var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
  var notification = window.webkitNotifications.createNotification(
    'water.png',                      // The image.
    hour + time[2] + ' ' + period, // The title.
    'Drink some water..'      // The body.
  );
  notification.show();
}

// Conditionally initialize the options.
if (!localStorage.isInitialized) {
  //localStorage.isActivated = true;   // The display activation.
  //localStorage.frequency = 1;        // The display frequency, in minutes.
  //localStorage.isInitialized = true; // The option initialization.
}

function getMilliSecUntilNextHour() {
  var d = new Date();
  var curTime = d.getTime();
  var millisec = d.getMilliseconds();
  var sec = d.getSeconds();
  var min = d.getMinutes();
  var hour = d.getHours();
  //var nextHourTime = curTime + (60-min)*60*1000 + (60-sec)*1000 + (1000-millisec);
  var milliSecUntilNextHour = (60-min)*60*1000 + (60-sec)*1000 + (1000-millisec);
  console.log('Next alert will be shown after '+(milliSecUntilNextHour/1000)+' seconds');
  return milliSecUntilNextHour;
}
// Test for notification support.
if (window.webkitNotifications) {
  // While activated, show notifications at the display frequency.
  //var milliSecUntilNextHour = getMilliSecUntilNextHour();
  //var millisecPerHour = 60*60*1000;
  setTimeout(function() {
	show();
	setInterval(function(){
	  show();
	}, getMilliSecUntilNextHour());
  }, getMilliSecUntilNextHour());
}
