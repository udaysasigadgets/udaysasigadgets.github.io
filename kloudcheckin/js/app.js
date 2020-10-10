$(document).ready(function () {
  /*
    $('.button-collapse').sideNav({
      menuWidth: 250, // Default is 300
      edge: 'left', // Choose the horizontal origin
      closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    }
  );
  */
  $("#photo").change(function (d) {
    const preview = document.querySelector('#photo-preview');
    const upload = document.querySelector('#photo-upload');
    const file = document.querySelector('#photo').files[0];
    const reader = new FileReader();

    reader.onload = function (readerEvent) {
      var image = new Image();
      image.onload = function (imageEvent) {

        // Resize the image to under 400px max
        var canvas = document.createElement('canvas'),
          max_size = 400,
          width = image.width,
          height = image.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        var dataUrl = canvas.toDataURL('image/jpeg');
        preview.src = dataUrl;
      }
      image.src = readerEvent.target.result;
    }
    if (file) {
      reader.readAsDataURL(file);
    }

    $("#photo-hint").hide();
    $("#retake-photo-hint").show();
    $("#photo-preview").show();
    $("#photo-upload").hide();
  });
})