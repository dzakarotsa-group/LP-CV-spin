const adminUrlForm = document.querySelector('#adminUrlForm');
const adminUrlInput = document.querySelector('#adminUrl');
const adminUrlMessage = document.querySelector('#adminUrlMessage');
const savedAdminUrl = localStorage.getItem('castilaAdminUrl');

if (savedAdminUrl) adminUrlInput.value = savedAdminUrl;

const isAdminDeploymentUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      /^\/macros\/(?:u\/\d+\/)?s\/[A-Za-z0-9_-]+\/exec\/?$/.test(url.pathname);
  } catch (error) {
    return false;
  }
};

adminUrlForm.addEventListener('submit', event => {
  event.preventDefault();
  const url = adminUrlInput.value.trim();
  if (!isAdminDeploymentUrl(url)) {
    adminUrlMessage.textContent = 'Gunakan URL deployment Admin Google Apps Script yang berakhiran /exec.';
    return;
  }

  localStorage.setItem('castilaAdminUrl', url);
  adminUrlMessage.textContent = 'URL tersimpan. Dashboard Google Apps Script dibuka di tab baru.';
  window.open(url, '_blank', 'noopener');
});
