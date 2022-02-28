// Copyright (c) 2018 Maen Artimy
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

$(function () {
  var path = window.location.pathname;
  var url  = window.location.href;

  var menu = '<div class="menuitem"> \
  <a href="index.html">Home</a> \
  <a href="flows.html">Flows</a> \
  <a href="groups.html">Groups</a> \
  <a href="meters.html">Meters</a> \
  <a href="flowform.html">Flow Control</a> \
  <a href="groupform.html">Group Control</a> \
  <a href="meterform.html">Meter Control</a> \
  <a href="topology.html">Topology</a> \
  <a href="messages.html">Messages</a> \
  <a href="config.html">Configuration</a> \
  <a href="about.html">About</a> \
  </div>'

/*  <div class="topmenu"> \
  <a href="#home">Flow Control</a> \
  <div id="myLinks"> \
    <a href="flowform.html">Flow Entry</a> \
    <a href="flowupload.html">Flow Upload</a> \
  </div> \
</div> \*/

  //var logo = '<div class="logowrapper"></div>';

  var hashtag = url.lastIndexOf('#')
  var slash = url.lastIndexOf('/') + 1
  var filename = hashtag < 0 ? url.substring(slash) : url.substring(slash, hashtag);

  $('#menu').html(menu);
  var $link = $('a[href="' + filename + '"]');
  $link.addClass("active");
  $link.parent().show();

  $(".topmenu").click(function() {
    //$("#myLinks").show();
    $("#myLinks").animate({height: "toggle"}, 120);
  })


});
