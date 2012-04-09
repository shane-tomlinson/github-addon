var form = document.querySelector("#preferences");

self.port.on("initialize", function(data) {
  for(var key in data) {
    updateElWithValue(key, data[key]);
  }
});

function updateElWithValue(key, value) {
  var element = document.querySelector("#" + key);
  if(element) {
    element.value = value || "";
    handleInputElement(element);
  }
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  var data = {
    username: document.querySelector("#username").value,
    page_size: document.querySelector("#page_size").value
  };
  self.port.emit("submit", data);
}, false);

