(function () {
  const form = document.getElementById('loginForm');
  const accessKeyInput = document.getElementById('accessKey');
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');

  // Check if already logged in
  fetch('/api/auth/session', { credentials: 'include' })
    .then((r) => r.json())
    .then((data) => {
      if (data.authenticated) {
        window.location.href = data.user.role === 'admin' ? '/admin' : '/storage';
      }
    })
    .catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';

    const accessKey = accessKeyInput.value.trim();
    if (!accessKey) {
      showError('Please enter your access key');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessKey }),
      });

      const data = await res.json();

      if (!data.success) {
        showError(data.message || data.error || 'Invalid Access Key');
        setLoading(false);
        return;
      }

      window.location.href = data.redirect || (data.role === 'admin' ? '/admin' : '/storage');
    } catch (err) {
      showError('Connection error. Please try again.');
      setLoading(false);
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('show');
  }

  function setLoading(loading) {
    loginBtn.disabled = loading;
    loginBtnText.classList.toggle('hidden', loading);
    loginSpinner.classList.toggle('hidden', !loading);
  }
})();
