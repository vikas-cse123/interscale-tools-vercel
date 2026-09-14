// Know Details — vanilla JS
(function () {
  var form = document.getElementById('detailsForm');
  var tokenInput = document.getElementById('metaToken');
  var submitBtn = document.getElementById('detailsSubmit');
  var alertBox = document.getElementById('detailsAlert');
  var resultPanel = document.getElementById('detailsResult');
  var resultHead = document.getElementById('detailsHead');
  var resultTitle = document.getElementById('detailsTitle');
  var resultMeta = document.getElementById('detailsMeta');
  var resultJson = document.getElementById('detailsJson');
  var resultKv = document.getElementById('detailsKv');

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

  function redactToken(str, token) {
    if (!token || !str) return str;
    // Avoid leaking full token — replace exact occurrences
    return str.split(token).join('[REDACTED]');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert();
    var token = tokenInput.value.trim();
    if (!token) {
      showAlert('Please enter your Meta access token.', 'error');
      tokenInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.3-8.6"/></svg> Fetching…';
    setResult('loading', 'Fetching details…', 'GET https://graph.facebook.com/v23.0/debug_token', 'Contacting Meta…');

    // Primary: try debug_token, fallback to /me if needed
    var debugUrl = 'https://graph.facebook.com/v23.0/debug_token?input_token=' + encodeURIComponent(token) + '&access_token=' + encodeURIComponent(token);

    fetch(debugUrl, { method: 'GET' })
      .then(function (res) {
        return res.text().then(function (text) {
          var parsed;
          try { parsed = JSON.parse(text); } catch (err) { parsed = null; }
          var prettyRaw = parsed ? JSON.stringify(parsed, null, 2) : text;
          var pretty = redactToken(prettyRaw, token);
          var status = res.status + ' ' + res.statusText;

          // If debug_token returned an error about missing permission, try /me as fallback
          if (!res.ok && parsed && parsed.error && parsed.error.code === 190) {
            // Still show the error but also try fallback
            // Try /me
            return fetch('https://graph.facebook.com/v23.0/me?access_token=' + encodeURIComponent(token), { method: 'GET' })
              .then(function (res2) {
                return res2.text().then(function (text2) {
                  var p2;
                  try { p2 = JSON.parse(text2); } catch (err) { p2 = null; }
                  var pr2Raw = p2 ? JSON.stringify(p2, null, 2) : text2;
                  var pr2 = redactToken(pr2Raw, token);
                  var s2 = res2.status + ' ' + res2.statusText;
                  if (res2.ok) {
                    setResult('success', 'Details Retrieved', s2, pr2);
                    showAlert('Details retrieved successfully.', 'success');
                  } else {
                    var kv2 = [];
                    if (p2 && p2.error) {
                      if (p2.error.message) kv2.push({ label: 'Error Message', value: p2.error.message });
                      if (p2.error.code != null) kv2.push({ label: 'Error Code', value: String(p2.error.code) });
                      if (p2.error.type) kv2.push({ label: 'Error Type', value: p2.error.type });
                    }
                    setResult('error', 'Failed to Retrieve Details', s2, pr2, kv2);
                    showAlert('Failed to retrieve details — see response below. HTTP ' + s2, 'error');
                  }
                });
              })
              .catch(function (err2) {
                // Fallback failed, show original debug_token error
                var kv = [];
                if (parsed && parsed.error) {
                  if (parsed.error.message) kv.push({ label: 'Error Message', value: parsed.error.message });
                  if (parsed.error.code != null) kv.push({ label: 'Error Code', value: String(parsed.error.code) });
                  if (parsed.error.type) kv.push({ label: 'Error Type', value: parsed.error.type });
                }
                setResult('error', 'Failed to Retrieve Details', status, pretty, kv);
                showAlert('Failed to retrieve details. HTTP ' + status, 'error');
              });
          }

          if (res.ok) {
            setResult('success', 'Details Retrieved', status, pretty);
            showAlert('Details retrieved successfully.', 'success');
          } else {
            // For non-190 errors, show directly (unless already handled)
            if (!(parsed && parsed.error && parsed.error.code === 190)) {
              var kv = [];
              if (parsed && parsed.error) {
                if (parsed.error.message) kv.push({ label: 'Error Message', value: parsed.error.message });
                if (parsed.error.code != null) kv.push({ label: 'Error Code', value: String(parsed.error.code) });
                if (parsed.error.type) kv.push({ label: 'Error Type', value: parsed.error.type });
              }
              setResult('error', 'Failed to Retrieve Details', status, pretty, kv);
              showAlert('Failed to retrieve details — see response below. HTTP ' + status, 'error');
            }
          }
        });
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        var isCors = msg.toLowerCase().indexOf('failed to fetch') !== -1 || msg.toLowerCase().indexOf('cors') !== -1 || msg.toLowerCase().indexOf('networkerror') !== -1;
        var pretty = JSON.stringify({ error: msg, hint: isCors ? 'This may be a CORS or network error. Meta may block direct browser requests.' : 'Network error' }, null, 2);
        setResult('error', isCors ? 'Network / CORS Error' : 'Network Error', 'No HTTP response', pretty);
        showAlert(isCors ? 'Network/CORS error — Meta may block direct browser requests. Details below.' : 'Network error: ' + msg, 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg> Get Details';
      });
  });

  if (!document.getElementById('spin-style')) {
    var s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
})();
