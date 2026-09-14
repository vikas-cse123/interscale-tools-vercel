// Interscale Tools — dashboard (no logic needed yet)
// Ensures cards are keyboard accessible and logo fallback check
document.addEventListener('DOMContentLoaded', function () {
  // Verify logo loads
  var logo = document.querySelector('.brand-logo');
  if (logo) {
    logo.addEventListener('error', function () {
      logo.style.display = 'none';
    });
  }
});
