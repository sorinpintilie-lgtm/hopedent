// Contact Form Handler for HopeDent
// Simple client-side form validation and feedback

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');

  if (!contactForm) return;

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Check if form is valid
    if (!contactForm.checkValidity()) {
      showMessage('Te rugăm să completezi toate câmpurile obligatorii.', 'error');
      return;
    }

    // Get form data (for demonstration - not actually sent)
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Simulate form submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se trimite...';

    // Simulate network delay
    setTimeout(function() {
      // Show success message
      showMessage('Cererea a fost înregistrată. Te vom contacta cât mai curând.', 'success');

      // Reset form
      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Trimite cererea';

      // Hide message after 5 seconds
      setTimeout(function() {
        hideMessage();
      }, 5000);
    }, 1000);
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message form-message--${type}`;
    formMessage.style.display = 'block';

    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideMessage() {
    formMessage.style.display = 'none';
  }

  // Real-time validation feedback
  const requiredFields = contactForm.querySelectorAll('input[required], select[required], textarea[required]');

  requiredFields.forEach(field => {
    field.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.classList.add('error');
      } else {
        this.classList.remove('error');
      }
    });

    field.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        this.classList.remove('error');
      }
    });
  });
});