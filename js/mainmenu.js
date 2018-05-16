$(function () {
  var path = window.location.pathname;
  var url  = window.location.href;

  var menu = '<div class="menuitem"> \
    <a href="index.html">Home</a> \
    <a href="monitor.html">Status Monitor</a> \
    <a href="flows.html">Flow Tables</a> \
    <a href="groups.html">Group Tables</a> \
    <a href="flowform.html">Flow Control</a> \
    <a href="groupform.html">Group Control</a> \
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
