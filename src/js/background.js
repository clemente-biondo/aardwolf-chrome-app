chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('html/main_ui.html', {
    'state':'maximized'
  });
});