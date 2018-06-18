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
    <a href="flows.html">Flow Tables</a> \
    <a href="groups.html">Group Tables</a> \
    <a href="flowform.html">Flow Control</a> \
    <a href="groupform.html">Group Control</a> \
    <a href="meterform.html">Meter Control</a> \
    <a href="topology.html">Topology</a> \
    <a href="messages.html">Messages</a> \
    <a href="about.html">About</a> \
  </div>'

  var logo = '<div class="logowrapper"></div>';

  var filename = url.substring(url.lastIndexOf('/')+1);

  $('#menu').html(menu);
  var $link = $('a[href="' + filename + '"]');
  $link.addClass("active");

});
