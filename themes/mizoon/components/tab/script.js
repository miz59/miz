document.addEventListener('DOMContentLoaded', function() {
  const tabLabels = document.querySelectorAll('.tab-labels .tab-label');
  const tabContents = document.querySelectorAll('.tab-contents .tab-content');

  tabLabels.forEach((label, idx) => {
    label.addEventListener('click', function() {
      tabLabels.forEach(l => l.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      tabContents[idx].classList.add('active');
    });
  });
});