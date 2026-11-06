const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new URLSearchParams(new FormData(form)).toString().replaceAll('+', '%20');
  location.href = `${form.action}?${fields}`;
});
