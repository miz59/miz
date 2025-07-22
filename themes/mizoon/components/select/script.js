document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.form-select').forEach(function(select) {
    select.addEventListener('change', function() {
      Array.from(select.options).forEach(function(option, idx) {
        if (idx === select.selectedIndex) {
          option.setAttribute('selected', '');
          option.selected = true;
        } else {
          option.removeAttribute('selected');
          option.selected = false;
        }
      });
    });

    Array.from(select.options).forEach(function(option, idx) {
      if (idx === select.selectedIndex) {
        option.setAttribute('selected', '');
        option.selected = true;
      } else {
        option.removeAttribute('selected');
        option.selected = false;
      }
    });
  });
});