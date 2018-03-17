$(function () {
  var path = window.location.pathname;
  var url  = window.location.href;

  var menu = '<div class="mainmenu"> \
    <a href="index.html">Home</a> \
    <a href="monitor.html">Status Monitor</a> \
    <a href="flows.html">Flow Monitor</a> \
    <a href="control.html">Flow Control</a> \
    <a href="logs.html">Notifications</a> \
    <a href="about.html">About</a> \
  </div>'

  var logo = '<div class="logowrapper"> \
    <p>&copy 2018 Maen Artimy </p> \
    <img src="img/Logo_trans_300x300.png" width="100px"> \
  </div>';

  var filename = url.substring(url.lastIndexOf('/')+1);

  $('#menu').html(menu);
  var $link = $('a[href="' + filename + '"]');
  $link.addClass("active");

});
