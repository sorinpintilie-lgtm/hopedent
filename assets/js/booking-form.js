// Booking Form Handler for HopeDent
// Client-side form validation and feedback for appointment requests

document.addEventListener('DOMContentLoaded', function() {
  const bookingForm = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('bookingSubmitBtn');
  const bookingMessage = document.getElementById('bookingMessage');

  if (!bookingForm) return;

  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Check required fields
    const requiredFields = ['prenume', 'telefon', 'gdpr-consent'];
    let hasErrors = false;

    requiredFields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (!field) return;

      if (field.type === 'checkbox') {
        if (!field.checked) {
          hasErrors = true;
          showFieldError(field, 'Acest câmp este obligatoriu');
        } else {
          clearFieldError(field);
        }
      } else {
        if (!field.value.trim()) {
          hasErrors = true;
          showFieldError(field, 'Acest câmp este obligatoriu');
        } else {
          clearFieldError(field);
        }
      }
    });

    if (hasErrors) {
      showMessage('Te rugăm să completezi câmpurile obligatorii.', 'error');
      return;
    }

    // Simulate form submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se trimite...';

    // Simulate network delay
    setTimeout(function() {
      // Show success message
      showMessage('Cererea a fost înregistrată. Te vom contacta cât mai curând pentru confirmare.', 'success');

      // Reset form
      bookingForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Trimite cererea';

      // Clear any field errors
      clearAllFieldErrors();

      // Hide message after 5 seconds
      setTimeout(function() {
        hideMessage();
      }, 5000);
    }, 1200);
  });

  function showMessage(text, type) {
    bookingMessage.textContent = text;
    bookingMessage.className = `form-message form-message--${type}`;
    bookingMessage.style.display = 'block';

    // Scroll to message
    bookingMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideMessage() {
    bookingMessage.style.display = 'none';
  }

  function showFieldError(field, message) {
    field.classList.add('error');

    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: #dc3545;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      font-weight: 500;
    `;
    field.parentNode.appendChild(errorElement);
  }

  function clearFieldError(field) {
    field.classList.remove('error');

    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  function clearAllFieldErrors() {
    bookingForm.querySelectorAll('.error').forEach(field => {
      clearFieldError(field);
    });
  }

  // Real-time validation for required fields
  ['prenume', 'nume', 'telefon'].forEach(fieldName => {
    const field = document.getElementById(fieldName);
    if (!field) return;

    field.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        showFieldError(this, 'Acest câmp este obligatoriu');
      } else {
        clearFieldError(this);
      }
    });

    field.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        clearFieldError(this);
      }
    });
  });

  // Special handling for phone field
  const phoneField = document.getElementById('telefon');
  if (phoneField) {
    phoneField.addEventListener('input', function() {
      // Remove non-numeric characters except spaces and dashes
      this.value = this.value.replace(/[^0-9\s\-]/g, '');
    });
  }
});