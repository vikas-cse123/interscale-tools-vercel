// Register WhatsApp Number — vanilla JS
(function () {
  var form = document.getElementById('registerForm');
  var phoneInput = document.getElementById('phoneId');
  var tokenInput = document.getElementById('accessToken');
  var submitBtn = document.getElementById('submitBtn');
  var alertBox = document.getElementById('formAlert');
  var resultPanel = document.getElementById('resultPanel');
  var resultHead = document.getElementById('resultHead');
  var resultTitle = document.getElementById('resultTitle');
  var resultMeta = document.getElementById('resultMeta');
  var resultJson = document.getElementById('resultJson');
  var resultKv = document.getElementById('resultKv');

  // Show/hide token
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('data-toggle'));
      var isPwd = target.type === 'password';
      target.type = isPwd ? 'text' : 'password';
      btn.querySelector('.eye-open').style.display = isPwd ? 'none' : 'block';
      btn.querySelector('.eye-closed').style.display = isPwd ? 'block' : 'none';
      btn.setAttribute('aria-label', isPwd ? 'Hide token' : 'Show token');
    });
  });

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = 'alert visible ' + type;
  }
  function hideAlert() {
    alertBox.className = 'alert';
    alertBox.textContent = '';
  }
  function setResult(state, title, meta, jsonText, kvData) {
    resultPanel.classList.add('visible');
    resultHead.className = 'result-head ' + state;
    resultTitle.textContent = title;
    resultMeta.textContent = meta || '';
    resultJson.textContent = jsonText || '';
    if (kvData && kvData.length) {
      resultKv.innerHTML = '';
      kvData.forEach(function (item) {
        var dt = document.createElement('dt');
        dt.textContent = item.label;
        var dd = document.createElement('dd');
        dd.textContent = item.value;
        resultKv.appendChild(dt);
        resultKv.appendChild(dd);
      });
      resultKv.style.display = 'grid';
    } else {
      resultKv.style.display = 'none';
      resultKv.innerHTML = '';
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert();

    var phoneId = phoneInput.value.trim();
    var token = tokenInput.value.trim();

    if (!phoneId) {
      showAlert('Please enter your Phone Number ID.', 'error');
      phoneInput.focus();
      return;
    }
    if (!token) {
      showAlert('Please enter your Permanent Access Token.', 'error');
      tokenInput.focus();
      return;
    }

    // UI loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.3-8.6"/></svg> Registering…';
    setResult('loading', 'Registering number…', 'POST https://graph.facebook.com/v23.0/' + phoneId + '/register', 'Sending request to Meta…');

    var url = 'https://graph.facebook.com/v23.0/' + encodeURIComponent(phoneId) + '/register';
    var body = JSON.stringify({ messaging_product: 'whatsapp', pin: '969532' });

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: body
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var parsed;
          try { parsed = JSON.parse(text); } catch (err) { parsed = null; }
          var pretty = parsed ? JSON.stringify(parsed, null, 2) : text;
          var status = res.status + ' ' + res.statusText;
          if (res.ok) {
            setResult('success', 'Number Registered Successfully', status, pretty);
            showAlert('WhatsApp number registered successfully.', 'success');
          } else {
            var kv = [];
            if (parsed && parsed.error) {
              if (parsed.error.message) kv.push({ label: 'Error Message', value: parsed.error.message });
              if (parsed.error.code != null) kv.push({ label: 'Error Code', value: String(parsed.error.code) });
              if (parsed.error.type) kv.push({ label: 'Error Type', value: parsed.error.type });
              if (parsed.error.error_subcode != null) kv.push({ label: 'Subcode', value: String(parsed.error.error_subcode) });
            }
            setResult('error', 'Registration Failed', status, pretty, kv);
            showAlert('Registration failed — see details below. HTTP ' + status, 'error');
          }
          return res;
        });
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        var isCors = msg.toLowerCase().indexOf('failed to fetch') !== -1 || msg.toLowerCase().indexOf('cors') !== -1 || msg.toLowerCase().indexOf('networkerror') !== -1;
        var pretty = JSON.stringify({ error: msg, hint: isCors ? 'This may be a CORS or network error. Meta may block direct browser requests. Try allowing CORS or use a server-side proxy.' : 'Network error' }, null, 2);
        setResult('error', isCors ? 'Network / CORS Error' : 'Network Error', 'No HTTP response', pretty);
        showAlert(isCors ? 'Network/CORS error — Meta may block direct browser requests. Details below.' : 'Network error: ' + msg, 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M22 11.09V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Register Number';
        // Do not clear token from DOM but keep in memory only for this session — do NOT persist
      });
  });

  // inject spin keyframes if not present
  if (!document.getElementById('spin-style')) {
    var s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
})();
