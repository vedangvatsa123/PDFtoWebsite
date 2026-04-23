// Popup script — save/load settings

document.addEventListener('DOMContentLoaded', () => {
  const providerEl = document.getElementById('provider');
  const apiKeyEl = document.getElementById('apiKey');
  const modelEl = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const keyHint = document.getElementById('keyHint');

  // Load saved settings
  chrome.storage.sync.get(['provider', 'apiKey', 'model'], (data) => {
    if (data.provider) providerEl.value = data.provider;
    if (data.apiKey) apiKeyEl.value = data.apiKey;
    if (data.model) modelEl.value = data.model;
    updateHint();
  });

  function updateHint() {
    if (providerEl.value === 'openai') {
      keyHint.innerHTML = 'Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" style="color:#666">platform.openai.com</a>';
    } else {
      keyHint.innerHTML = 'Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#666">aistudio.google.com</a>';
    }
  }

  providerEl.addEventListener('change', updateHint);

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
      provider: providerEl.value,
      apiKey: apiKeyEl.value.trim(),
      model: modelEl.value.trim(),
    }, () => {
      statusEl.classList.add('visible');
      setTimeout(() => statusEl.classList.remove('visible'), 2000);
    });
  });
});
