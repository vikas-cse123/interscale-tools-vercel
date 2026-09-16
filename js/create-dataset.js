// Create Dataset — vanilla JS
(function () {
  var form = document.getElementById('datasetForm');
  var wabaInput = document.getElementById('wabaId');
  var tokenInput = document.getElementById('dsToken');
  var submitBtn = document.getElementById('dsSubmit');
  var alertBox = document.getElementById('dsAlert');
  var resultPanel = document.getElementById('dsResult');
  var resultHead = document.getElementById('dsHead');
  var resultTitle = document.getElementById('dsTitle');
  var resultMeta = document.getElementById('dsMeta');
  var resultJson = document.getElementById('dsJson');
  var resultKv = document.getElementById('dsKv');

  var DATASET_NAME = 'My Dataset ID';

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
    var wabaId = wabaInput.value.trim();
    var token = tokenInput.value.trim();

    if (!wabaId) {
      showAlert('Please enter your WABA ID.', 'error');
      wabaInput.focus();
      return;
    }
    if (!token) {
      showAlert('Please enter your Permanent Access Token.', 'error');
      tokenInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.3-8.6"/></svg> Creating…';
    setResult('loading', 'Creating dataset…', 'POST https://graph.facebook.com/v23.0/' + wabaId + '/dataset', 'Sending request to Meta…');

    var url = 'https://graph.facebook.com/v23.0/' + encodeURIComponent(wabaId) + '/dataset';
    var body = 'dataset_name=' + encodeURIComponent(DATASET_NAME) + '&access_token=' + encodeURIComponent(token);

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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
            setResult('success', 'Dataset Created Successfully', status, pretty);
            showAlert('Dataset created successfully.', 'success');
          } else {
            var kv = [];
            if (parsed && parsed.error) {
              if (parsed.error.message) kv.push({ label: 'Error Message', value: parsed.error.message });
              if (parsed.error.code != null) kv.push({ label: 'Error Code', value: String(parsed.error.code) });
              if (parsed.error.type) kv.push({ label: 'Error Type', value: parsed.error.type });
              if (parsed.error.error_subcode != null) kv.push({ label: 'Subcode', value: String(parsed.error.error_subcode) });
            }
            // redact token if somehow echoed back (defensive)
            pretty = pretty.replace(token, '[REDACTED]');
            setResult('error', 'Dataset Creation Failed', status, pretty, kv);
            showAlert('Dataset creation failed — see details below. HTTP ' + status, 'error');
          }
          return res;
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
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Create Dataset';
      });
  });

  if (!document.getElementById('spin-style')) {
    var s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
})();
