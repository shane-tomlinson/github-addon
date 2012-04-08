var form = document.querySelector("#preferences");

self.port.on("initialize", function(data) {
  for(var key in data) {
    console.log(key + ": " + data[key]);
  }

  document.querySelector("#username").value = data.username || "";
  document.querySelector("#page_size").value = data.page_size || "";
});

form.addEventListener("submit", function(event) {
  event.preventDefault();

  var data = {
    username: document.querySelector("#username").value,
    page_size: document.querySelector("#page_size").value
  };
  self.port.emit("submit", data);
}, false);

